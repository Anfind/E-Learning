'use client';

import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Learning Platform</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Hệ thống học và thi online với công nghệ nhận diện khuôn mặt, 
              đảm bảo tính minh bạch và chất lượng trong quá trình học tập.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Liên kết</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/majors" className="text-muted-foreground hover:text-primary transition-colors">
                  Ngành học
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/qa" className="text-muted-foreground hover:text-primary transition-colors">
                  Q&A
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: support@learning.vn</li>
              <li>Phone: 1900 xxxx</li>
              <li>Địa chỉ: TP.HCM, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Learning Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
