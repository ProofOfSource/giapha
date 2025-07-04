import React from 'react';
import { Share2, UserSquare2, LockKeyhole, Newspaper } from 'lucide-react';

const LandingPage = () => {
    const FeatureCard = ({ icon, title, description }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="inline-block p-4 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-full mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
    );

    return (
        <>
            <header className="bg-cover bg-center text-white" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://placehold.co/1200x600/a1887f/5f4339?text=Dòng+Họ+Phạm)' }}>
                <div className="container mx-auto text-center px-4 py-32">
                    <h1 className="text-5xl font-bold mb-4">Website Gia phả Dòng họ Phạm</h1>
                    <p className="text-xl mb-8 max-w-3xl mx-auto">Nơi kết nối cội nguồn, lưu giữ ký ức và thắt chặt tình thân cho mọi thế hệ con cháu.</p>
                </div>
            </header>
            <main className="py-20 bg-amber-50 dark:bg-gray-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-amber-900 dark:text-amber-400 mb-12">Tính năng Nổi bật</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard icon={<Share2 size={32}/>} title="Sơ đồ Tương tác" description="Trực quan hóa cây gia phả qua nhiều thế hệ, dễ dàng kéo, thả, phóng to và tra cứu."/>
                        <FeatureCard icon={<UserSquare2 size={32}/>} title="Hồ sơ Chi tiết" description="Mỗi thành viên có một trang riêng với tiểu sử, hình ảnh và các mối quan hệ gia đình."/>
                        <FeatureCard icon={<LockKeyhole size={32}/>} title="Bảo mật & Phân quyền" description="Thông tin nhạy cảm được bảo vệ. Chỉ thành viên được duyệt mới có quyền xem và sửa đổi."/>
                        <FeatureCard icon={<Newspaper size={32}/>} title="Không gian Cộng đồng" description="Đăng tải tin tức, sự kiện họp họ, chia sẻ hình ảnh và gắn kết các thành viên."/>
                    </div>
                </div>
            </main>
            <footer className="bg-amber-800 dark:bg-gray-800 text-amber-100 dark:text-amber-300 py-6 text-center">
                <p>&copy; {new Date().getFullYear()} - Ban Liên lạc Dòng họ Phạm. Phát triển với tâm huyết và lòng thành kính.</p>
            </footer>
        </>
    );
};

export default LandingPage;
