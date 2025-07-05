import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase/config.js';

// Hàm trợ giúp để căn giữa vùng cắt ban đầu với tỷ lệ khung hình 1:1
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight,
    );
}

export default function AvatarManager({ personId, onSave, onClose }) {
    // State để lưu trữ URL dữ liệu của ảnh người dùng chọn (dạng base64)
    const [imgSrc, setImgSrc] = useState('');
    // Ref cho canvas xem trước (để vẽ ảnh đã cắt)
    const previewCanvasRef = useRef(null);
    // Ref cho phần tử ảnh chính mà người dùng thấy và cắt
    const imgRef = useRef(null);
    // State cho đối tượng vùng cắt (do ReactCrop quản lý)
    const [crop, setCrop] = useState();
    // State cho vùng cắt đã hoàn thành (tính bằng pixel), được cập nhật sau khi người dùng dừng cắt
    const [completedCrop, setCompletedCrop] = useState();
    // State cho trạng thái tải lên để vô hiệu hóa nút và hiển thị thông báo
    const [loading, setLoading] = useState(false);
    // Tỷ lệ khung hình (1:1 cho ảnh vuông)
    const aspect = 1;

    // Hook này chạy mỗi khi vùng cắt (completedCrop) thay đổi.
    // Nó chịu trách nhiệm cập nhật bản xem trước 40x40.
    useEffect(() => {
        if (
            completedCrop?.width &&
            completedCrop?.height &&
            imgRef.current &&
            previewCanvasRef.current
        ) {
            // Vẽ bản xem trước 40x40 của vùng ảnh đã cắt
            const image = imgRef.current;
            const canvas = previewCanvasRef.current;
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return;
            }

            canvas.width = 40;
            canvas.height = 40;

            // Vẽ phần đã cắt của ảnh gốc lên canvas xem trước
            ctx.drawImage(
                image,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                40,
                40,
            );
        }
    }, [completedCrop]);

    // Xử lý khi người dùng chọn một tệp ảnh từ máy tính
    function onSelectFile(e) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset vùng cắt khi chọn ảnh mới
            const reader = new FileReader();
            // Đọc tệp ảnh và chuyển thành URL dữ liệu (base64) để hiển thị
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    // Xử lý khi ảnh đã được tải và hiển thị trong phần tử <img>
    function onImageLoad(e) {
        imgRef.current = e.currentTarget;
        const { width, height } = e.currentTarget;
        // Tạo và đặt vùng cắt ban đầu ở giữa ảnh
        const newCrop = centerAspectCrop(width, height, aspect);
        setCrop(newCrop);
        setCompletedCrop(newCrop);
    }

    // Xử lý khi người dùng nhấp vào nút "Lưu ảnh"
    async function handleUpload() {
        const image = imgRef.current;
        const previewCanvas = previewCanvasRef.current;
        if (!image || !previewCanvas || !completedCrop) {
            throw new Error('Vùng cắt không tồn tại');
        }

        setLoading(true);

        // Tạo một canvas mới để thay đổi kích thước ảnh thành 40x40
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 40;
        finalCanvas.height = 40;
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) { throw new Error('Không thể tạo context 2d cho canvas cuối cùng'); }

        // Vẽ ảnh từ canvas xem trước (đã được cập nhật trong useEffect) vào canvas cuối cùng
        finalCtx.drawImage(previewCanvas, 0, 0, 40, 40);

        // Lấy URL dữ liệu base64 của ảnh 40x40
        const base64Image = finalCanvas.toDataURL('image/jpeg');
        // Tạo một tham chiếu đến Firebase Storage với đường dẫn duy nhất
        const storageRef = ref(storage, `avatars/${personId}/${Date.now()}.jpg`);

        try {
            // Tải chuỗi base64 lên Storage
            await uploadString(storageRef, base64Image, 'data_url');
            // Lấy URL tải xuống của ảnh vừa tải lên
            const downloadURL = await getDownloadURL(storageRef);
            // Gọi hàm onSave được truyền từ component cha với URL mới
            onSave(downloadURL);
            // Đóng modal
            onClose();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Không thể tải ảnh lên.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-800 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full border-2 border-blue-500">
                <h2 className="text-2xl font-bold mb-4">Cập nhật ảnh đại diện</h2>
                <div className="space-y-4">
                    {/* Nút chọn tệp */}
                    <input type="file" accept="image/*" onChange={onSelectFile} className="bg-gray-500 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                    
                    {/* Vùng hiển thị ảnh và công cụ cắt */}
                    {imgSrc && (
                        <div className="flex justify-center my-4" style={{ maxHeight: '50vh', overflow: 'auto' }}>
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspect}
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop me"
                                    src={imgSrc}
                                    onLoad={onImageLoad}
                                />
                            </ReactCrop>
                        </div>
                    )}
                    {/* Vùng xem trước ảnh 40x40 */}
                    {imgSrc && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Xem trước (40x40px):</p>
                            <canvas
                                ref={previewCanvasRef}
                                className="rounded-full border"
                                style={{
                                    width: 40,
                                    height: 40,
                                }}
                            />
                        </div>
                    )}
                </div>
                {/* Các nút hành động */}
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={loading || !completedCrop?.width || !completedCrop?.height}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"
                    >
                        {loading ? 'Đang tải lên...' : 'Lưu ảnh'}
                    </button>
                </div>
            </div>
        </div>
    );
}
