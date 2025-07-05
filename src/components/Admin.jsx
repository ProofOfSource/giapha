import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { app, auth } from '../firebase/config.js';
import AdminTreeView from './AdminTreeView.jsx';
import SearchableDropdown from './SearchableDropdown.jsx';
import ProposedChangesAdmin from './ProposedChangesAdmin.jsx';
import AvatarManager from './AvatarManager.jsx';
import AdminProposals from './AdminProposals'; // Import the new component

const db = getFirestore(app);

// ====================================================================
// Component: UserManagement
// Chức năng: Hiển thị danh sách người dùng, cho phép admin thay đổi vai trò
// và liên kết tài khoản người dùng với một hồ sơ trong cây gia phả.
// ====================================================================
const UserManagement = ({ persons }) => {
    // State để lưu danh sách người dùng từ Firestore
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // useEffect để lắng nghe thay đổi trong collection 'users' theo thời gian thực
    useEffect(() => {
        const usersCollection = collection(db, 'users');
        const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);
            setLoading(false);
        }, (err) => {
            setError('Không thể tải danh sách người dùng.');
            setLoading(false);
            console.error(err);
        });
        // Dọn dẹp listener khi component bị unmount
        return () => unsubscribe();
    }, []);

    // Xử lý khi admin thay đổi vai trò của người dùng
    const handleRoleChange = async (userId, newRole) => {
        const userRef = doc(db, 'users', userId);
        try {
            await setDoc(userRef, { role: newRole }, { merge: true });
        } catch (err) {
            console.error("Lỗi khi cập nhật vai trò:", err);
            alert("Đã có lỗi xảy ra khi cập nhật vai trò.");
        }
    };

    // Xử lý khi admin liên kết một tài khoản với một hồ sơ person
    const handleLinkPerson = async (userId, personId) => {
        const userRef = doc(db, 'users', userId);
        try {
            await setDoc(userRef, { personId: personId }, { merge: true });
            alert('Liên kết thành công!');
        } catch (err) {
            console.error("Lỗi khi liên kết:", err);
            alert("Đã có lỗi xảy ra khi liên kết.");
        }
    };

    if (loading) return <p className="p-8 dark:text-gray-300">Đang tải danh sách người dùng...</p>;
    if (error) return <p className="p-8 text-red-600">{error}</p>;

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-400 mb-4">Quản lý Thành viên</h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
                {/* Bảng hiển thị danh sách người dùng */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên hiển thị</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vai trò hiện tại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <tr key={user.id} className="dark:text-gray-200">
                                <td className="px-6 py-4 whitespace-nowrap">{user.displayName || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.role === 'admin' || user.role === 'root_admin' ? 'bg-red-100 text-red-800' :
                                        user.role === 'member' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                                        <select 
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)} 
                                            value={user.role}
                                            className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                                            disabled={user.role === 'root_admin'}
                                        >
                                            <option value="pending">pending</option>
                                            <option value="member">member</option>
                                            <option value="admin">admin</option>
                                        </select>
                                        <div className="w-full md:w-64"> {/* Make it full width on small screens */}
                                            <SearchableDropdown
                                                options={persons}
                                                value={user.personId}
                                                onChange={(value) => handleLinkPerson(user.id, value)}
                                                placeholder="Liên kết với Person..."
                                                styles={{
                                                    control: (provided, state) => ({
                                                        ...provided,
                                                        borderColor: state.isFocused ? '#2563eb' : provided.borderColor, // blue-600
                                                        boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : provided.boxShadow,
                                                        '&:hover': {
                                                            borderColor: state.isFocused ? '#2563eb' : provided.borderColor,
                                                        },
                                                    }),
                                                }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AddPersonForm = ({ onAddPerson, onCancel, initialData = {} }) => {
    const [name, setName] = useState(initialData.name || '');
    const [birthDate, setBirthDate] = useState(initialData.birthDate || '');
    const [deathDate, setDeathDate] = useState(initialData.deathDate || '');
    const [fatherId, setFatherId] = useState(initialData.fatherId || '');
    const [motherId, setMotherId] = useState(initialData.motherId || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = !!initialData.id;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            alert('Vui lòng nhập tên.');
            return;
        }
        setIsSubmitting(true);
        try {
            await onAddPerson({ name, birthDate, deathDate, fatherId, motherId });
            if (!isEditing) {
                setName('');
                setBirthDate('');
                setDeathDate('');
                setFatherId('');
                setMotherId('');
            }
        } catch (error) {
            console.error("Lỗi khi lưu thành viên:", error);
            alert('Đã có lỗi xảy ra.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg shadow space-y-4 mb-6">
            <h3 className="text-lg font-bold text-amber-900">{isEditing ? 'Chỉnh sửa thông tin' : 'Thêm thành viên mới'}</h3>
            <input type="text" placeholder="Họ và tên" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
            <input type="text" placeholder="Ngày sinh (YYYY-MM-DD)" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Ngày mất (YYYY-MM-DD)" value={deathDate} onChange={e => setDeathDate(e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="ID người cha" value={fatherId} onChange={e => setFatherId(e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="ID người mẹ" value={motherId} onChange={e => setMotherId(e.target.value)} className="w-full p-2 border rounded" />
            <div className="flex gap-4">
                <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400">
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thành viên'}
                </button>
                <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors">
                    Hủy
                </button>
            </div>
        </form>
    );
};

// ====================================================================
// Component: AdminManageTree
// Chức năng: Giao diện chính để quản lý cây gia phả, bao gồm việc
// hiển thị danh sách thành viên và form chỉnh sửa (PersonEditor).
// ====================================================================
const AdminManageTree = () => {
    // State cho chế độ xem (bảng hoặc cây)
    const [view, setView] = useState('table');
    // State lưu danh sách tất cả thành viên
    const [persons, setPersons] = useState([]);
    const [unions, setUnions] = useState([]);
    // State lưu thông tin của người đang được chọn để chỉnh sửa
    const [selectedPerson, setSelectedPerson] = useState(null);
    // State cờ để xác định đang ở chế độ thêm mới hay chỉnh sửa
    const [isAdding, setIsAdding] = useState(false);

    // Lắng nghe và cập nhật danh sách thành viên và hôn nhân từ Firestore
    useEffect(() => {
        const unsubPersons = onSnapshot(collection(db, 'persons'), (snapshot) => {
            setPersons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubUnions = onSnapshot(collection(db, 'unions'), (snapshot) => {
            setUnions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => {
            unsubPersons();
            unsubUnions();
        };
    }, []);

    // Xử lý lưu thông tin (thêm mới hoặc cập nhật) của một thành viên
    const handleSavePerson = async (personData) => {
        // Nếu đang chỉnh sửa, dùng ID có sẵn. Nếu thêm mới, tạo ID mới.
        const id = selectedPerson?.id || (isAdding ? doc(collection(db, 'persons')).id : null);
        if (!id) return;
        
        const personRef = doc(db, 'persons', id);
        await setDoc(personRef, personData, { merge: true });
        
        alert('Lưu thành công!');
        // Reset state sau khi lưu
        setSelectedPerson(null);
        setIsAdding(false);
    };

    // Xử lý xóa một thành viên
    const handleDeletePerson = async (personId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
            await deleteDoc(doc(db, 'persons', personId));
            alert('Xóa thành công!');
            if (selectedPerson?.id === personId) {
                setSelectedPerson(null);
            }
        }
    };

    // Xác định đối tượng person đang hoạt động để truyền vào PersonEditor
    const activePerson = isAdding ? {} : selectedPerson;

    return (
        <div className="p-8">
            {/* Header và các nút chuyển đổi */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-400">Quản lý Cây gia phả</h2>
                <div>
                    <button onClick={() => setView(view === 'table' ? 'tree' : 'table')} className="mr-4 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-bold py-2 px-4 rounded-full transition-colors">
                        {view === 'table' ? 'Xem dạng cây' : 'Xem dạng bảng'}
                    </button>
                    {!isAdding && (
                        <button onClick={() => { setSelectedPerson(null); setIsAdding(true); }} className="bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">+</button>
                    )}
                </div>
            </div>

            {view === 'tree' ? <AdminTreeView /> : (
                <div className="flex gap-8">
                    {/* Cột trái: Danh sách thành viên */}
                    <div className="w-1/3">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow max-h-[75vh] overflow-y-auto">
                            <ul>
                                {persons.map(person => (
                                    <li 
                                        key={person.id} 
                                        onClick={() => { setSelectedPerson(person); setIsAdding(false); }} 
                                        className={`p-2 rounded cursor-pointer text-gray-800 dark:text-gray-200 hover:bg-amber-100 dark:hover:bg-gray-700 ${selectedPerson?.id === person.id ? 'bg-amber-200 dark:bg-amber-900 border-l-4 border-amber-500' : 'border-l-4 border-transparent'}`}
                                    >
                                        {`${person.name} ${person.nickname ? `(${person.nickname})` : ''}`.trim()}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Cột phải: Form chỉnh sửa chi tiết */}
                    <div className="w-2/3">
                        {activePerson ? (
                            <PersonEditor 
                                key={activePerson.id || 'new'}
                                person={activePerson}
                                allPersons={persons}
                                allUnions={unions}
                                onSave={handleSavePerson}
                                onDelete={handleDeletePerson}
                                onCancel={() => { setSelectedPerson(null); setIsAdding(false); }}
                                isAdding={isAdding}
                            />
                        ) : (
                            <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
                                <p className="dark:text-gray-300">Chọn một thành viên để xem chi tiết hoặc thêm mới.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ====================================================================
// Component: PersonEditor
// Chức năng: Form chi tiết để admin thêm mới hoặc chỉnh sửa thông tin
// của một thành viên trong cây gia phả.
// ====================================================================
const PersonEditor = ({ person, allPersons, allUnions, onSave, onDelete, onCancel, isAdding }) => {
    // State lưu dữ liệu của form, khởi tạo từ props `person`
    const [formData, setFormData] = useState({
        ...person,
        contact: person.contact || {} // Đảm bảo `contact` luôn là một object
    });
    const [spouses, setSpouses] = useState([]);
    const [newSpouseId, setNewSpouseId] = useState('');
    // State để điều khiển việc mở/đóng modal quản lý ảnh đại diện
    const [isAvatarManagerOpen, setIsAvatarManagerOpen] = useState(false);

    // Tìm và cập nhật danh sách vợ/chồng khi person hoặc unions thay đổi
    useEffect(() => {
        if (person.id && allUnions.length > 0) {
            const currentSpouses = allUnions
                .filter(u => u.husbandId === person.id || u.wifeId === person.id)
                .map(u => {
                    const spouseId = u.husbandId === person.id ? u.wifeId : u.husbandId;
                    const spouseData = allPersons.find(p => p.id === spouseId);
                    return { ...spouseData, unionId: u.id };
                });
            setSpouses(currentSpouses);
        } else {
            setSpouses([]);
        }
    }, [person, allUnions, allPersons]);


    // Cập nhật lại state của form khi `person` prop thay đổi
    useEffect(() => {
        setFormData({
            ...person,
            contact: person.contact || {}
        });
    }, [person]);

    // Xử lý thay đổi trên các trường input
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Xử lý riêng cho các trường lồng trong object `contact`
        if (name.startsWith("contact.")) {
            const field = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, [field]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Xử lý khi submit form, gọi hàm onSave từ component cha
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    // Xử lý khi ảnh đại diện được tải lên thành công từ AvatarManager
    const handleAvatarSave = async (newUrl) => {
        if (!person.id) return;
        
        // Cập nhật state cục bộ ngay lập tức để người dùng thấy thay đổi
        setFormData(prev => ({ ...prev, profilePictureUrl: newUrl }));

        // Cập nhật thẳng vào tài liệu Firestore
        const personRef = doc(db, 'persons', person.id);
        try {
            await setDoc(personRef, { profilePictureUrl: newUrl }, { merge: true });
        } catch (error) {
            console.error("Lỗi khi cập nhật ảnh đại diện:", error);
            alert("Không thể lưu ảnh đại diện vào cơ sở dữ liệu.");
            // Nếu lỗi, có thể cân nhắc khôi phục lại ảnh cũ
            setFormData(prev => ({ ...prev, profilePictureUrl: person.profilePictureUrl }));
        }
    };

    const handleAddSpouse = async () => {
        if (!newSpouseId || !person.id) {
            alert("Vui lòng chọn một người để thêm làm vợ/chồng.");
            return;
        }
        const newUnion = person.gender === 'male' 
            ? { husbandId: person.id, wifeId: newSpouseId }
            : { husbandId: newSpouseId, wifeId: person.id };
        
        try {
            await addDoc(collection(db, 'unions'), newUnion);
            alert("Thêm vợ/chồng thành công.");
            setNewSpouseId(''); // Reset dropdown
        } catch (error) {
            console.error("Lỗi khi thêm vợ/chồng:", error);
            alert("Đã có lỗi xảy ra.");
        }
    };

    const handleRemoveSpouse = async (unionId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa mối quan hệ hôn nhân này?")) {
            try {
                await deleteDoc(doc(db, 'unions', unionId));
                alert("Xóa thành công.");
            } catch (error) {
                console.error("Lỗi khi xóa vợ/chồng:", error);
                alert("Đã có lỗi xảy ra.");
            }
        }
    };

    const inputStyle = "w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";
    const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">{isAdding ? 'Thêm thành viên mới' : `Chỉnh sửa: ${person.name}`}</h2>
            
            {/* Vùng quản lý ảnh đại diện */}
            <div className="flex flex-col items-center gap-2 mb-4">
                <img 
                    src={formData.profilePictureUrl || 'https://placehold.co/100'} 
                    alt="Avatar" 
                    className="rounded-full object-cover border" 
                    style={{ width: '96px', height: '96px' }}
                />
                <button 
                    type="button" 
                    onClick={() => {
                        if (!isAdding && person.id) {
                            setIsAvatarManagerOpen(true);
                        }
                    }} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    disabled={isAdding || !person.id}
                >
                    Thay đổi ảnh
                </button>
            </div>
            {/* Thông báo cho người dùng khi đang ở chế độ thêm mới */}
            {(isAdding || !person.id) && <p className="text-sm text-yellow-600 -mt-4 mb-4">Bạn cần lưu thành viên trước khi thêm ảnh đại diện.</p>}

            {/* Render modal AvatarManager khi cần */}
            {isAvatarManagerOpen && person.id && (
                <AvatarManager
                    personId={person.id}
                    onSave={handleAvatarSave}
                    onClose={() => setIsAvatarManagerOpen(false)}
                />
            )}
            
            {/* Các trường thông tin chi tiết */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelStyle}>Họ và tên</label><input name="name" value={formData.name || ''} onChange={handleChange} className={inputStyle} /></div>
                <div><label className={labelStyle}>Tên thường gọi</label><input name="nickname" value={formData.nickname || ''} onChange={handleChange} className={inputStyle} /></div>
                {/* Thêm trường Cha */}
                <div>
                    <label className={labelStyle}>Cha</label>
                    <SearchableDropdown
                        options={allPersons}
                        value={formData.fatherId}
                        onChange={(value) => handleChange({ target: { name: 'fatherId', value: value } })}
                        placeholder="Chọn cha..."
                    />
                </div>
                {/* Thêm trường Mẹ */}
                <div>
                    <label className={labelStyle}>Mẹ</label>
                    <SearchableDropdown
                        options={allPersons}
                        value={formData.motherId}
                        onChange={(value) => handleChange({ target: { name: 'motherId', value: value } })}
                        placeholder="Chọn mẹ..."
                    />
                </div>
                <div><label className={labelStyle}>Ngày sinh (Dương)</label><input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className={inputStyle} /></div>
                <div><label className={labelStyle}>Ngày sinh (Âm)</label><input type="text" name="lunarBirthDate" value={formData.lunarBirthDate || ''} onChange={handleChange} placeholder="VD: 15/10/Nhâm Dần" className={inputStyle} /></div>
                <div><label className={labelStyle}>Ngày mất (Dương)</label><input type="date" name="deathDate" value={formData.deathDate || ''} onChange={handleChange} className={inputStyle} /></div>
                <div><label className={labelStyle}>Ngày mất (Âm)</label><input type="text" name="lunarDeathDate" value={formData.lunarDeathDate || ''} onChange={handleChange} placeholder="VD: 01/01/Giáp Thìn" className={inputStyle} /></div>
                <div>
                    <label className={labelStyle}>Giới tính</label>
                    <select name="gender" value={formData.gender || 'other'} onChange={handleChange} className={inputStyle}>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div><label className={labelStyle}>Nơi ở hiện tại</label><input name="currentAddress" value={formData.currentAddress || ''} onChange={handleChange} className={inputStyle} /></div>
                <div><label className={labelStyle}>Email cá nhân</label><input type="email" name="contact.personalEmail" value={formData.contact.personalEmail || ''} onChange={handleChange} className={inputStyle} /></div>
                <div><label className={labelStyle}>Số điện thoại</label><input type="tel" name="contact.phone" value={formData.contact.phone || ''} onChange={handleChange} className={inputStyle} /></div>
                <div className="md:col-span-2"><label className={labelStyle}>Facebook</label><input name="contact.facebook" value={formData.contact.facebook || ''} onChange={handleChange} className={inputStyle} /></div>
                <div className="md:col-span-2"><label className={labelStyle}>Thông tin khác</label><textarea name="otherInfo" value={formData.otherInfo || ''} onChange={handleChange} rows="3" className={inputStyle}></textarea></div>
                
            </div>

            <div>
                <label className={labelStyle}>Cha</label>
                <SearchableDropdown options={allPersons.filter(p => p.gender !== 'female')} value={formData.fatherId} onChange={val => setFormData(p => ({...p, fatherId: val}))} placeholder="Chọn cha..." />
            </div>
            <div>
                <label className={labelStyle}>Mẹ</label>
                <SearchableDropdown options={allPersons.filter(p => p.gender !== 'male')} value={formData.motherId} onChange={val => setFormData(p => ({...p, motherId: val}))} placeholder="Chọn mẹ..." />
            </div>

            <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">Vợ/Chồng</h3>
                {spouses.map(spouse => (
                    <div key={spouse.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
                        <span className="dark:text-gray-300">{spouse.name}</span>
                        <button type="button" onClick={() => handleRemoveSpouse(spouse.unionId)} className="text-red-500 hover:text-red-700">Xóa</button>
                    </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex-grow">
                        <SearchableDropdown
                            options={allPersons.filter(p => p.id !== person.id && !spouses.some(s => s.id === p.id))}
                            value={newSpouseId}
                            onChange={setNewSpouseId}
                            placeholder="Thêm vợ/chồng..."
                        />
                    </div>
                    <button type="button" onClick={handleAddSpouse} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+</button>
                </div>
            </div>
            
            <div><label className={labelStyle}>Tiểu sử</label><textarea name="biography" value={formData.biography || ''} onChange={handleChange} rows="3" className={inputStyle}></textarea></div>
            <div><label className={labelStyle}>Thành tựu</label><textarea name="achievements" value={formData.achievements || ''} onChange={handleChange} rows="3" className={inputStyle}></textarea></div>
            
            <div className="md:col-span-2"><label className={labelStyle}>Nơi chôn cất</label><input name="burialPlace" value={formData.burialPlace || ''} onChange={handleChange} className={inputStyle} /></div>

            <div className="flex items-center gap-2">
                <input type="checkbox" name="isDeceased" checked={formData.isDeceased || false} onChange={handleChange} className="h-4 w-4 rounded" />
                <label className={labelStyle}>Đã qua đời</label>
            </div>
            
            <div className="flex justify-between items-center pt-4">
                <div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Lưu thay đổi</button>
                    <button type="button" onClick={onCancel} className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Hủy</button>
                </div>
                {!isAdding && <button type="button" onClick={() => onDelete(person.id)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Xóa</button>}
            </div>
        </form>
    );
};

// ====================================================================
// Component: AdminManageStories
// Chức năng: Giao diện cho admin để tạo và xóa các bài đăng, câu chuyện.
// ====================================================================
const AdminManageStories = () => {
    const [stories, setStories] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const storiesCollection = collection(db, 'stories');
        const unsubscribe = onSnapshot(storiesCollection, (snapshot) => {
            const storiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStories(storiesList.sort((a, b) => b.createdAt - a.createdAt));
        });
        return () => unsubscribe();
    }, []);

    const handleAddStory = async (e) => {
        e.preventDefault();
        if (!title || !content) {
            alert('Vui lòng nhập tiêu đề và nội dung.');
            return;
        }
        setIsSubmitting(true);
        try {
            const storiesCollection = collection(db, 'stories');
            await addDoc(storiesCollection, {
                title,
                content,
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                coverImageUrl: '',
                taggedPersons: []
            });
            setTitle('');
            setContent('');
        } catch (error) {
            console.error("Lỗi khi đăng câu chuyện:", error);
            alert('Đã có lỗi xảy ra khi đăng câu chuyện.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStory = async (storyId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa câu chuyện này?')) {
            try {
                await deleteDoc(doc(db, 'stories', storyId));
            } catch (error) {
                console.error("Lỗi khi xóa câu chuyện:", error);
                alert('Đã có lỗi xảy ra khi xóa câu chuyện.');
            }
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-400 mb-4">Quản lý Ký ức & Câu chuyện</h2>
            
            <form onSubmit={handleAddStory} className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow space-y-4">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Tạo câu chuyện mới</h3>
                <input type="text" placeholder="Tiêu đề" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required />
                <textarea placeholder="Nội dung" value={content} onChange={e => setContent(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" rows="4" required></textarea>
                <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400">
                    {isSubmitting ? 'Đang đăng...' : 'Đăng câu chuyện'}
                </button>
            </form>

            <h3 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-4">Các câu chuyện đã đăng</h3>
            <div className="space-y-4">
                {stories.map(story => (
                    <div key={story.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h4 className="font-bold text-lg dark:text-gray-100">{story.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Đăng lúc: {story.createdAt ? new Date(story.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{story.content}</p>
                        <button onClick={() => handleDeleteStory(story.id)} className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Xóa</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ====================================================================
// Component: AdminDashboard
// Chức năng: Bảng điều khiển chính của trang admin, chứa các nút điều hướng.
// ====================================================================
const AdminDashboard = ({ setActivePage }) => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-red-700 dark:text-red-400">Bảng điều khiển Quản trị</h1>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => setActivePage('user-management')} className="p-6 bg-blue-100 text-blue-800 rounded-lg shadow hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors">
                    <h3 className="font-bold text-lg">Quản lý Thành viên</h3>
                </button>
                <button onClick={() => setActivePage('manage-tree')} className="p-6 bg-green-100 text-green-800 rounded-lg shadow hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors">
                    <h3 className="font-bold text-lg">Quản lý Cây gia phả</h3>
                </button>
                <button onClick={() => setActivePage('manage-stories')} className="p-6 bg-yellow-100 text-yellow-800 rounded-lg shadow hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800 transition-colors">
                    <h3 className="font-bold text-lg">Quản lý Ký ức</h3>
                </button>
                 <button onClick={() => setActivePage('proposed-changes')} className="p-6 bg-purple-100 text-purple-800 rounded-lg shadow hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 transition-colors">
                    <h3 className="font-bold text-lg">Duyệt Thay Đổi</h3>
                </button>
                 <button onClick={() => setActivePage('manage-proposals')} className="p-6 bg-teal-100 text-teal-800 rounded-lg shadow hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:hover:bg-teal-800 transition-colors">
                    <h3 className="font-bold text-lg">Quản lý Đề xuất</h3>
                </button>
            </div>
        </div>
    );
};

// ====================================================================
// Component: AdminPage (Component chính)
// Chức năng: Đóng vai trò là "bộ định tuyến" cho các trang con trong khu vực admin.
// Sử dụng một câu lệnh switch để render component tương ứng với `adminSubPage`.
// ====================================================================
export const AdminPage = ({ adminSubPage, setAdminSubPage }) => {
    const [persons, setPersons] = useState([]);

    // Tải danh sách persons một lần ở đây và truyền xuống các component con nếu cần
    useEffect(() => {
        const personsCollection = collection(db, 'persons');
        const unsubscribe = onSnapshot(personsCollection, (snapshot) => {
            const personsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPersons(personsList);
        });
        return () => unsubscribe();
    }, []);

    switch (adminSubPage) {
        case 'user-management': return <UserManagement persons={persons} />;
        case 'manage-tree': return <AdminManageTree />;
        case 'manage-stories': return <AdminManageStories />;
        case 'proposed-changes': return <ProposedChangesAdmin />;
        case 'manage-proposals': return <AdminProposals />; // Add case for AdminProposals
        default: return <AdminDashboard setActivePage={setAdminSubPage} />;
    }
};
