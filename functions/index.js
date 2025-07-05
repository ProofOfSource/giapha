// Import các module cần thiết theo cú pháp Firebase SDK v1
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const { migrateData } = require('./migration.js');

const db = admin.firestore();

// Expose the migration script as a callable function
exports.runMigration = functions.https.onCall(async (data, context) => {
    // Optional: Add admin check for security
    // if (!context.auth || !context.auth.token.admin) {
    //   throw new functions.https.HttpsError("permission-denied", "Chỉ có Admin mới có quyền thực hiện hành động này.");
    // }
    try {
        await migrateData();
        return { success: true, message: "Data migration completed successfully." };
    } catch (error) {
        console.error("Error during migration:", error);
        throw new functions.https.HttpsError("internal", "An error occurred during data migration.", error);
    }
});


// 1. Hàm được kích hoạt khi có tài khoản mới (sử dụng cú pháp SDK v1)
// Tách logic ra một hàm riêng để dễ phân tích hơn
const createUserData = async (user) => {
    const { uid, email, displayName, photoURL } = user;
    await db.collection("users").doc(uid).set({
      email,
      displayName,
      photoURL,
      role: "member",
      personId: null,
      status: "pending_approval",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    functions.logger.info(`User document created for ${email} (${uid}) with pending status.`);
};
exports.onusercreate = functions.auth.user().onCreate(createUserData);


// 2. Hàm cho Admin phê duyệt một tài khoản thành viên (sử dụng cú pháp SDK v1)
exports.approveUserAccount = functions.https.onCall(async (data, context) => {
  // Trong SDK v1, thông tin xác thực nằm trong context.auth
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Bạn phải đăng nhập để thực hiện hành động này.");
  }
  
  // Quan trọng: Để kiểm tra quyền Admin, bạn cần thiết lập Custom Claims.
  // Đây là một bước bảo mật cần thiết ở môi trường production.
  // if (!context.auth.token.admin) {
  //   throw new functions.https.HttpsError("permission-denied", "Chỉ có Admin mới có quyền thực hiện hành động này.");
  // }

  // Trong SDK v1, dữ liệu được truyền vào nằm trong đối tượng `data`
  const { targetUserId } = data;
  if (!targetUserId) {
    throw new functions.https.HttpsError("invalid-argument", "Cần cung cấp ID của người dùng cần duyệt.");
  }
  
  const userRef = db.collection("users").doc(targetUserId);
  
  await userRef.update({
      status: "active",
  });

  return { success: true, message: `Tài khoản ${targetUserId} đã được duyệt thành công.` };
});


// 3. Hàm cho Admin phê duyệt một yêu cầu chỉnh sửa gia phả (sử dụng cú pháp SDK v1)
exports.approveEditRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Bạn phải đăng nhập để thực hiện hành động này.");
  }
  
  // if (!context.auth.token.admin) {
  //   throw new functions.https.HttpsError("permission-denied", "Chỉ có Admin mới có quyền thực hiện hành động này.");
  // }

  const { requestId } = data;
  if (!requestId) {
    throw new functions.https.HttpsError("invalid-argument", "Cần có ID của yêu cầu.");
  }

  const requestRef = db.collection("edit_requests").doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Không tìm thấy yêu cầu.");
  }

  const requestData = requestDoc.data();
  
  const personRef = db.collection("persons").doc(requestData.personId);
  const isSensitive = requestData.fieldToUpdate === 'contact';
  const targetRef = isSensitive ? db.collection("private_person_data").doc(requestData.personId) : personRef;

  await db.runTransaction(async (transaction) => {
    const updateData = { [requestData.fieldToUpdate]: requestData.newValue };
    transaction.set(targetRef, updateData, { merge: true });
    
    transaction.update(requestRef, {
      status: "approved",
      resolverId: context.auth.uid, 
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { success: true, message: "Yêu cầu đã được phê duyệt thành công." };
});

// 4. Hàm để lấy danh sách những người chưa được liên kết với tài khoản nào
exports.getUnlinkedPersons = functions.https.onCall(async (data, context) => {
  // Bảo mật: Chỉ những user đã đăng nhập mới được gọi hàm này
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Bạn phải đăng nhập để thực hiện hành động này.");
  }

  try {
    // Lấy danh sách tất cả personId đã được liên kết trong collection 'users'
    const usersSnapshot = await db.collection("users").get();
    const linkedPersonIds = usersSnapshot.docs
      .map((doc) => doc.data().personId)
      .filter(Boolean); // Lọc ra những giá trị không phải null/undefined

    // Lấy danh sách tất cả persons
    const personsSnapshot = await db.collection("persons").get();
    const allPersons = personsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Lọc ra những person chưa có trong danh sách đã liên kết
    const unlinkedPersons = allPersons.filter(
      (person) => !linkedPersonIds.includes(person.id)
    );

    return unlinkedPersons;
  } catch (error) {
    functions.logger.error("Lỗi khi lấy danh sách unlinked persons:", error);
    throw new functions.https.HttpsError("internal", "Không thể lấy danh sách người trong gia phả.");
  }
});

// 5. Hàm để cập nhật thông tin của một thành viên trong gia đình
exports.updateFamilyMember = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Bạn phải đăng nhập.");
    }

    const { personId, updatedData } = data;
    const userId = context.auth.uid;

    const userDoc = await db.collection("users").doc(userId).get();
    const currentUserPersonId = userDoc.data().personId;

    if (!currentUserPersonId) {
        throw new functions.https.HttpsError("failed-precondition", "Tài khoản của bạn chưa được liên kết.");
    }

    // Logic to verify relationship (similar to isFamilyMember)
    const targetPersonDoc = await db.collection("persons").doc(personId).get();
    const currentUserPersonDoc = await db.collection("persons").doc(currentUserPersonId).get();

    const isParent = currentUserPersonDoc.data().fatherId === personId || currentUserPersonDoc.data().motherId === personId;
    const isChild = targetPersonDoc.data().fatherId === currentUserPersonId || targetPersonDoc.data().motherId === currentUserPersonId;
    
    // Check for spouse relationship
    const unionsRef = db.collection("unions");
    const husbandQuery = unionsRef.where("husbandId", "==", currentUserPersonId).where("wifeId", "==", personId);
    const wifeQuery = unionsRef.where("wifeId", "==", currentUserPersonId).where("husbandId", "==", personId);
    const husbandSnapshot = await husbandQuery.get();
    const wifeSnapshot = await wifeQuery.get();
    const isSpouse = !husbandSnapshot.empty || !wifeSnapshot.empty;

    // Check for sibling relationship (sharing at least one parent)
    const currentUserParents = [currentUserPersonDoc.data().fatherId, currentUserPersonDoc.data().motherId].filter(Boolean);
    const targetParents = [targetPersonDoc.data().fatherId, targetPersonDoc.data().motherId].filter(Boolean);
    const isSibling = currentUserParents.some(p => targetParents.includes(p));

    const isAllowed = isParent || isChild || isSpouse || isSibling;

    if (!isAllowed) {
        const userRoles = userDoc.data().role;
        if (userRoles !== 'admin' && userRoles !== 'root_admin') {
            throw new functions.https.HttpsError("permission-denied", "Bạn không có quyền chỉnh sửa người này.");
        }
    }

    try {
        await db.collection("persons").doc(personId).update(updatedData);
        return { success: true, message: "Cập nhật thành công." };
    } catch (error) {
        functions.logger.error("Lỗi khi cập nhật family member:", error);
        throw new functions.https.HttpsError("internal", "Không thể cập nhật thông tin.");
    }
});

// 6. Hàm để một thành viên đề xuất thay đổi thông tin
exports.proposeChange = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Bạn phải đăng nhập để thực hiện hành động này.");
    }

    const { targetPersonId, changedData, proposerNote } = data;
    const proposerId = context.auth.uid;

    if (!targetPersonId || !changedData) {
        throw new functions.https.HttpsError("invalid-argument", "Cần cung cấp targetPersonId và changedData.");
    }

    try {
        await db.collection("proposed_changes").add({
            proposerId,
            targetPersonId,
            changedData,
            proposerNote: proposerNote || "",
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: "Đề xuất của bạn đã được gửi đi." };
    } catch (error) {
        functions.logger.error("Lỗi khi tạo đề xuất:", error);
        throw new functions.https.HttpsError("internal", "Không thể tạo đề xuất thay đổi.");
    }
});

// 7. Hàm được kích hoạt khi một đề xuất được cập nhật (phê duyệt/từ chối)
exports.handleProposedChangeApproval = functions.firestore
    .document('proposed_changes/{changeId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Chỉ hành động khi trạng thái thay đổi thành 'approved'
        if (newValue.status === 'approved' && previousValue.status !== 'approved') {
            const { targetPersonId, changedData } = newValue;

            if (!targetPersonId || !changedData) {
                functions.logger.error("Thiếu targetPersonId hoặc changedData trong đề xuất:", context.params.changeId);
                return null;
            }

            const personRef = db.collection('persons').doc(targetPersonId);

            try {
                await personRef.set(changedData, { merge: true });
                functions.logger.info(`Đã áp dụng thay đổi cho person ${targetPersonId} từ đề xuất ${context.params.changeId}`);
                return null;
            } catch (error) {
                functions.logger.error(`Lỗi khi áp dụng thay đổi cho person ${targetPersonId}:`, error);
                // Cân nhắc: có thể cập nhật lại trạng thái đề xuất thành 'failed'
                await change.after.ref.update({ status: 'failed', error: error.message });
                return null;
            }
        }
        return null;
    });

// Callable function to propose relationship changes
exports.proposeRelationshipChange = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Bạn phải đăng nhập để thực hiện hành động này.');
    }

    const { relationshipType, targetPersonId, newPersonData, linkedPersonId, proposerId } = data;

    // Basic validation
    if (!relationshipType || !targetPersonId || !proposerId) {
        throw new functions.https.HttpsError('invalid-argument', 'Thiếu thông tin cần thiết.');
    }

    // Ensure proposerId matches the authenticated user's uid
    if (proposerId !== context.auth.uid) {
         throw new functions.https.HttpsError('permission-denied', 'Bạn không có quyền gửi đề xuất cho người dùng khác.');
    }

    try {
        const proposalData = {
            proposerId: proposerId,
            targetPersonId: targetPersonId,
            relationshipType: relationshipType,
            status: 'pending', // Proposals start as pending
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (newPersonData) {
            // Mode: Add new person and link relationship
            // Validate new person data (basic validation)
            if (!newPersonData.name || !newPersonData.gender) {
                 throw new functions.https.HttpsError('invalid-argument', 'Thiếu thông tin người mới (tên, giới tính).');
            }
            proposalData.type = 'add_person_and_relationship';
            proposalData.newPersonData = newPersonData;

        } else if (linkedPersonId) {
            // Mode: Link existing person
            // Verify linkedPersonId exists
            const linkedPersonRef = db.collection('persons').doc(linkedPersonId);
            const linkedPersonDoc = await linkedPersonRef.get();
            if (!linkedPersonDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Không tìm thấy người cần liên kết.');
            }
            proposalData.type = 'link_relationship';
            proposalData.linkedPersonId = linkedPersonId;

        } else {
             throw new functions.https.HttpsError('invalid-argument', 'Cần cung cấp thông tin người mới hoặc ID người cần liên kết.');
        }

        // Add the proposal to a 'proposals' collection
        await db.collection('proposals').add(proposalData);

        return { success: true, message: "Đề xuất thay đổi mối quan hệ đã được gửi để xem xét." };

    } catch (error) {
        functions.logger.error("Lỗi khi tạo đề xuất mối quan hệ:", error);
        // Check if it's already an HttpsError
        if (error.code) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Không thể tạo đề xuất thay đổi mối quan hệ.", error);
    }
});

// Callable function to add a new story
exports.addStory = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Bạn phải đăng nhập để đăng bài.');
    }

    const { title, content, coverImageUrl, taggedPersons } = data;
    const authorId = context.auth.uid;

    // Basic validation
    if (!title || !content) {
        throw new functions.https.HttpsError('invalid-argument', 'Tiêu đề và nội dung bài viết không được để trống.');
    }

    try {
        const newStory = {
            title: title,
            content: content,
            authorId: authorId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            coverImageUrl: coverImageUrl || null,
            taggedPersons: taggedPersons || [],
        };

        // Add the new story to the 'stories' collection
        const docRef = await db.collection('stories').add(newStory);

        return { success: true, storyId: docRef.id, message: "Bài viết đã được đăng thành công." };

    } catch (error) {
        functions.logger.error("Lỗi khi đăng bài viết:", error);
        // Check if it's already an HttpsError
        if (error.code) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Không thể đăng bài viết.", error);
    }
});

// Callable function to approve a proposal
exports.approveProposal = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated and is an admin (TODO: Implement proper admin check)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Bạn phải đăng nhập để thực hiện hành động này.');
    }
    // TODO: Add proper admin role check here
    // if (!context.auth.token.admin) {
    //   throw new functions.https.HttpsError("permission-denied", "Chỉ có Admin mới có quyền thực hiện hành động này.");
    // }

    const { proposalId } = data;

    if (!proposalId) {
        throw new functions.https.HttpsError('invalid-argument', 'Thiếu ID đề xuất.');
    }

    const proposalRef = db.collection('proposals').doc(proposalId);

    try {
        await db.runTransaction(async (transaction) => {
            const proposalDoc = await transaction.get(proposalRef);

            if (!proposalDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Không tìm thấy đề xuất.');
            }

            const proposalData = proposalDoc.data();

            if (proposalData.status !== 'pending') {
                throw new functions.https.HttpsError('failed-precondition', 'Đề xuất này không còn ở trạng thái chờ duyệt.');
            }

            // Handle different proposal types
            if (proposalData.type === 'add_person_and_relationship') {
                const { targetPersonId, relationshipType, newPersonData } = proposalData;

                // 1. Add the new person
                const newPersonRef = db.collection('persons').doc(); // Auto-generate ID
                transaction.set(newPersonRef, {
                    ...newPersonData,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    // Add other default fields if necessary
                });
                const newPersonId = newPersonRef.id;

                // 2. Update the target person with the new relationship
                const targetPersonRef = db.collection('persons').doc(targetPersonId);
                const updateTargetData = {};
                if (relationshipType === 'child') {
                    // Add newPersonId to targetPerson's children array (assuming an array field 'childrenIds')
                    // Or update fatherId/motherId of the new person
                    // Let's update fatherId/motherId of the new person for simplicity based on targetPerson's gender
                     const targetPersonDoc = await transaction.get(targetPersonRef);
                     const targetPersonGender = targetPersonDoc.data().gender;
                     if (targetPersonGender === 'male') {
                         updateTargetData.fatherId = targetPersonId; // This is incorrect, should update newPersonData
                         transaction.update(newPersonRef, { fatherId: targetPersonId });
                     } else if (targetPersonGender === 'female') {
                         updateTargetData.motherId = targetPersonId; // This is incorrect, should update newPersonData
                         transaction.update(newPersonRef, { motherId: targetPersonId });
                     } else {
                          // Handle other/unknown gender case - maybe add to a 'children' array on target?
                          // For now, let's assume male/female parents
                           throw new functions.https.HttpsError('failed-precondition', 'Không thể thêm con cho người có giới tính không xác định.');
                     }

                } else if (relationshipType === 'spouse') {
                     // Create a new union document
                     const unionRef = db.collection('unions').doc(); // Auto-generate ID
                     const targetPersonDoc = await transaction.get(targetPersonRef);
                     const targetPersonGender = targetPersonDoc.data().gender;

                     if (targetPersonGender === 'male') {
                         transaction.set(unionRef, {
                             husbandId: targetPersonId,
                             wifeId: newPersonId,
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                             // Add other union details like startDate, endDate, etc.
                         });
                     } else if (targetPersonGender === 'female') {
                          transaction.set(unionRef, {
                             husbandId: newPersonId,
                             wifeId: targetPersonId,
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                             // Add other union details
                         });
                     } else {
                          throw new functions.https.HttpsError('failed-precondition', 'Không thể thêm vợ/chồng cho người có giới tính không xác định.');
                     }

                } else if (relationshipType === 'parent') {
                    // Update the new person with the target person as parent
                    const newPersonDoc = await transaction.get(newPersonRef); // Need to get the newly created doc
                    const targetPersonDoc = await transaction.get(targetPersonRef);
                    const targetPersonGender = targetPersonDoc.data().gender;

                    if (targetPersonGender === 'male') {
                        transaction.update(newPersonRef, { fatherId: targetPersonId });
                    } else if (targetPersonGender === 'female') {
                        transaction.update(newPersonRef, { motherId: targetPersonId });
                    } else {
                         throw new functions.https.HttpsError('failed-precondition', 'Không thể thêm cha/mẹ có giới tính không xác định.');
                    }
                }
                // Note: Sibling relationship is derived, no direct update needed here.

            } else if (proposalData.type === 'link_relationship') {
                 const { targetPersonId, relationshipType, linkedPersonId } = proposalData;

                 // Update the target person or linked person based on relationshipType
                 const targetPersonRef = db.collection('persons').doc(targetPersonId);
                 const linkedPersonRef = db.collection('persons').doc(linkedPersonId);

                 if (relationshipType === 'child') {
                     // Update fatherId/motherId of the linked person
                     const targetPersonDoc = await transaction.get(targetPersonRef);
                     const targetPersonGender = targetPersonDoc.data().gender;
                     if (targetPersonGender === 'male') {
                         transaction.update(linkedPersonRef, { fatherId: targetPersonId });
                     } else if (targetPersonGender === 'female') {
                         transaction.update(linkedPersonRef, { motherId: targetPersonId });
                     } else {
                          throw new functions.https.HttpsError('failed-precondition', 'Không thể liên kết con cho người có giới tính không xác định.');
                     }
                 } else if (relationshipType === 'spouse') {
                     // Create a new union document
                     const unionRef = db.collection('unions').doc(); // Auto-generate ID
                     const targetPersonDoc = await transaction.get(targetPersonRef);
                     const targetPersonGender = targetPersonDoc.data().gender;

                     if (targetPersonGender === 'male') {
                         transaction.set(unionRef, {
                             husbandId: targetPersonId,
                             wifeId: linkedPersonId,
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                             // Add other union details
                         });
                     } else if (targetPersonGender === 'female') {
                          transaction.set(unionRef, {
                             husbandId: linkedPersonId,
                             wifeId: targetPersonId,
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                             // Add other union details
                         });
                     } else {
                          throw new functions.https.HttpsError('failed-precondition', 'Không thể liên kết vợ/chồng cho người có giới tính không xác định.');
                     }
                 } else if (relationshipType === 'parent') {
                     // Update the target person with the linked person as parent
                     const linkedPersonDoc = await transaction.get(linkedPersonRef);
                     const linkedPersonGender = linkedPersonDoc.data().gender;

                     if (linkedPersonGender === 'male') {
                         transaction.update(targetPersonRef, { fatherId: linkedPersonId });
                     } else if (linkedPersonGender === 'female') {
                         transaction.update(targetPersonRef, { motherId: linkedPersonId });
                     } else {
                          throw new functions.https.HttpsError('failed-precondition', 'Không thể liên kết cha/mẹ có giới tính không xác định.');
                     }
                 }
                 // Sibling relationship is derived.

            } else if (proposalData.type === 'person_data_change') {
                // This type is handled by the handleProposedChangeApproval trigger.
                // Just update the status here.
                 // No additional transaction logic needed for this type here.
            } else {
                 throw new functions.https.HttpsError('invalid-argument', 'Loại đề xuất không hợp lệ.');
            }


            // Update the proposal status to approved
            transaction.update(proposalRef, {
                status: 'approved',
                resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
                resolverId: context.auth.uid,
            });
        });

        return { success: true, message: "Đề xuất đã được phê duyệt thành công." };

    } catch (error) {
        functions.logger.error("Lỗi khi phê duyệt đề xuất:", error);
         // Check if it's already an HttpsError
        if (error.code) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Không thể phê duyệt đề xuất.", error);
    }
});

// Callable function to reject a proposal
exports.rejectProposal = functions.https.onCall(async (data, context) => {
     // Check if the user is authenticated and is an admin (TODO: Implement proper admin check)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Bạn phải đăng nhập để thực hiện hành động này.');
    }
    // TODO: Add proper admin role check here
    // if (!context.auth.token.admin) {
    //   throw new functions.https.HttpsError("permission-denied", "Chỉ có Admin mới có quyền thực hiện hành động này.");
    // }

    const { proposalId, rejectionReason } = data;

    if (!proposalId) {
        throw new functions.https.HttpsError('invalid-argument', 'Thiếu ID đề xuất.');
    }

    const proposalRef = db.collection('proposals').doc(proposalId);

    try {
        await proposalRef.update({
            status: 'rejected',
            resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
            resolverId: context.auth.uid,
            rejectionReason: rejectionReason || null,
        });

        return { success: true, message: "Đề xuất đã bị từ chối." };

    } catch (error) {
        functions.logger.error("Lỗi khi từ chối đề xuất:", error);
         // Check if it's already an HttpsError
        if (error.code) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Không thể từ chối đề xuất.", error);
    }
});
