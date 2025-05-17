import Link from 'next/link';
import Image from 'next/image';
import HomeHeader from '@/components/HomeHeader';
import HomeContent from '@/components/HomeContent';
import FooterUserLinks from '@/components/FooterUserLinks';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">      {/* Header */}      <HomeHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Connecting Talent with Opportunities
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              TalentExcel bridges the gap between students, educational institutions, and employers, 
              creating a seamless ecosystem for talent and career development.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/register" className="btn-primary text-center">
                Get Started
              </Link>
              <Link href="/contact" className="btn-outline text-center">
                Learn More
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-full max-w-md h-80 bg-gray-200 rounded-lg relative overflow-hidden">
              {/* Placeholder for hero image */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">              Hero Image Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>      <HomeContent />

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-semibold">Rahul Sharma</h4>
                  <p className="text-gray-500 text-sm">Computer Science Student</p>
                </div>
              </div>
              <p className="text-gray-600">
                "TalentExcel helped me find my dream internship at a top tech company. The platform is intuitive and made the application process seamless."
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-semibold">Priya Patel</h4>
                  <p className="text-gray-500 text-sm">HR Manager</p>
                </div>
              </div>
              <p className="text-gray-600">
                "As an employer, TalentExcel has streamlined our recruitment process. We've found exceptional candidates through the platform."
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-semibold">Dr. Anand Kumar</h4>
                  <p className="text-gray-500 text-sm">TPO, Engineering College</p>
                </div>
              </div>
              <p className="text-gray-600">
                "TalentExcel has revolutionized how we manage placements. The analytics and tracking features are invaluable for our institution."
              </p>
            </div>
          </div>
        </div>      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TalentExcel</h3>
              <p className="text-gray-400">
                Connecting talent with opportunities across India.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link href="/jobs" className="text-gray-400 hover:text-white">Jobs</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>            <FooterUserLinks />
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <address className="text-gray-400 not-italic">
                <p>Email: info@talentexcel.com</p>
                <p>Phone: +91 123 456 7890</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} TalentExcel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
