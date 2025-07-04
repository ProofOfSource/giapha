import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { app, auth } from '../firebase/config.js';
import AdminTreeView from './AdminTreeView.jsx';
import SearchableDropdown from './SearchableDropdown.jsx';

const db = getFirestore(app);

const UserManagement = ({ persons }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        const userRef = doc(db, 'users', userId);
        try {
            await setDoc(userRef, { role: newRole }, { merge: true });
        } catch (err) {
            console.error("Lỗi khi cập nhật vai trò:", err);
            alert("Đã có lỗi xảy ra khi cập nhật vai trò.");
        }
    };

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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <select 
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)} 
                                            value={user.role}
                                            className="p-1 border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                                            disabled={user.role === 'root_admin'}
                                        >
                                            <option value="pending">pending</option>
                                            <option value="member">member</option>
                                            <option value="admin">admin</option>
                                        </select>
                                        <SearchableDropdown
                                            options={persons}
                                            value={user.personId}
                                            onChange={(value) => handleLinkPerson(user.id, value)}
                                            placeholder="Liên kết với Person..."
                                        />
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

const AdminManageTree = () => {
    const [view, setView] = useState('table');
    const [persons, setPersons] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'persons'), (snapshot) => {
            setPersons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleSavePerson = async (personData) => {
        const id = selectedPerson?.id || (isAdding ? doc(collection(db, 'persons')).id : null);
        if (!id) return;
        
        const personRef = doc(db, 'persons', id);
        await setDoc(personRef, personData, { merge: true });
        
        alert('Lưu thành công!');
        setSelectedPerson(null);
        setIsAdding(false);
    };

    const handleDeletePerson = async (personId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
            await deleteDoc(doc(db, 'persons', personId));
            alert('Xóa thành công!');
            if (selectedPerson?.id === personId) {
                setSelectedPerson(null);
            }
        }
    };

    const activePerson = isAdding ? {} : selectedPerson;

    return (
        <div className="p-8">
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
                    {/* Left Column: List of Persons */}
                    <div className="w-1/3">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow max-h-[75vh] overflow-y-auto">
                            <ul>
                                {persons.map(person => (
                                    <li key={person.id} onClick={() => { setSelectedPerson(person); setIsAdding(false); }} className={`p-2 rounded cursor-pointer text-gray-800 dark:text-gray-200 hover:bg-amber-100 dark:hover:bg-gray-700 ${selectedPerson?.id === person.id ? 'bg-amber-200 dark:bg-amber-900' : ''}`}>
                                        {person.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Details and Edit Form */}
                    <div className="w-2/3">
                        {activePerson ? (
                            <PersonEditor 
                                key={activePerson.id || 'new'}
                                person={activePerson}
                                allPersons={persons}
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

const PersonEditor = ({ person, allPersons, onSave, onDelete, onCancel, isAdding }) => {
    const [formData, setFormData] = useState(person);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const inputStyle = "p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">{isAdding ? 'Thêm thành viên mới' : `Chỉnh sửa: ${person.name}`}</h2>
            
            <div className="grid grid-cols-2 gap-4">
                <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Họ và tên" className={inputStyle} />
                <input name="nickname" value={formData.nickname || ''} onChange={handleChange} placeholder="Tên húy" className={inputStyle} />
                <select name="gender" value={formData.gender || 'other'} onChange={handleChange} className={inputStyle}>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                </select>
                <input name="birthDate" value={formData.birthDate || ''} onChange={handleChange} placeholder="Ngày sinh" className={inputStyle} />
                <input name="deathDate" value={formData.deathDate || ''} onChange={handleChange} placeholder="Ngày mất" className={inputStyle} />
            </div>

            <div>
                <label className="font-semibold dark:text-gray-300">Cha</label>
                <SearchableDropdown options={allPersons.filter(p => p.gender === 'male')} value={formData.fatherId} onChange={val => setFormData(p => ({...p, fatherId: val}))} placeholder="Chọn cha..." />
            </div>
            <div>
                <label className="font-semibold dark:text-gray-300">Mẹ</label>
                <SearchableDropdown options={allPersons.filter(p => p.gender === 'female')} value={formData.motherId} onChange={val => setFormData(p => ({...p, motherId: val}))} placeholder="Chọn mẹ..." />
            </div>
            
            <textarea name="biography" value={formData.biography || ''} onChange={handleChange} placeholder="Tiểu sử" className={`w-full ${inputStyle}`}></textarea>
            
            <div className="flex justify-between items-center">
                <div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Lưu thay đổi</button>
                    <button type="button" onClick={onCancel} className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Hủy</button>
                </div>
                {!isAdding && <button type="button" onClick={() => onDelete(person.id)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Xóa</button>}
            </div>
        </form>
    );
};

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
            </div>
        </div>
    );
};

export const AdminPage = ({ adminSubPage, setAdminSubPage }) => {
    const [persons, setPersons] = useState([]);

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
        default: return <AdminDashboard setActivePage={setAdminSubPage} />;
    }
};
