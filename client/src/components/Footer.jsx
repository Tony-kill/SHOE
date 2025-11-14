import { Twitter, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black text-gray-300 py-12">
            <div className="w-[80%] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Cột 1 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">TravelBooking</h3>
                    <p className="text-sm mb-6">
                        Khám phá thế giới cùng chúng tôi – mang đến cho bạn những hành trình tuyệt vời, trải nghiệm đáng
                        nhớ và dịch vụ chất lượng.
                    </p>
                    <div className="flex space-x-3">
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Twitter size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Facebook size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700">
                            <Instagram size={18} />
                        </a>
                    </div>
                </div>

                {/* Cột 2 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Thông tin liên hệ</h3>
                    <ul className="space-y-3 text-sm">
                        <li>📍 235 Hoàng Quốc Việt, Hà Nội, Việt Nam</li>
                        <li>📞 +84 123 456 789</li>
                        <li>✉️ support@travelbooking.com</li>
                        <li>🕒 Làm việc: 08:00 - 22:00 (T2 - CN)</li>
                    </ul>
                </div>

                {/* Cột 3 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Điểm đến phổ biến</h3>
                    <ul className="space-y-2 text-sm">
                        <li>• Đà Nẵng</li>
                        <li>• Nha Trang</li>
                        <li>• Phú Quốc</li>
                        <li>• Sapa</li>
                        <li>• Hạ Long</li>
                    </ul>
                </div>

                {/* Cột 4 */}
                <div>
                    <h3 className="text-white font-semibold mb-4 text-lg">Đăng ký nhận ưu đãi</h3>
                    <p className="text-sm mb-4">
                        Đừng bỏ lỡ các tour giảm giá và khuyến mãi hấp dẫn, hãy nhập email của bạn để nhận tin mới nhất.
                    </p>
                </div>
            </div>
        </footer>
    );
}
