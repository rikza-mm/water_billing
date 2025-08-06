'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCube, FaBars, FaArrowRight, FaPlayCircle, FaBolt, FaCode, FaMobileAlt, FaTwitter, FaGithub, FaLinkedin, FaDiscord } from 'react-icons/fa';
import { easeInOut, motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

const fadeInVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeInOut } },
};

function LiquidBlob({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#6366f1"
        transparent
        opacity={0.6}
        roughness={0.8}
        metalness={0.3}
      />
    </mesh>
  );
}

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] font-poppins">
      {/* Background blobs */}
      <div className="blob blob-1 absolute -z-10 blur-[60px] opacity-60 bg-gradient-to-br from-indigo-400 to-purple-400 w-[300px] h-[300px] top-[20%] left-[10%] rounded-full animate-[moveBlob1_15s_infinite_alternate]" />
      <div className="blob blob-2 absolute -z-10 blur-[60px] opacity-60 bg-gradient-to-br from-pink-400 to-pink-200 w-[250px] h-[250px] bottom-[20%] right-[10%] rounded-full animate-[moveBlob2_12s_infinite_alternate]" />

      {/* Navigation */}
      <motion.nav initial="hidden" animate="show" variants={fadeInVariants} className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="bg-white/30 backdrop-blur-lg border border-white/30 shadow-lg ring-1 ring-white/20 px-4 py-2 flex items-center rounded-2xl">
            <FaCube className="text-purple-600 text-xl mr-2" />
            <span className="font-bold text-gray-800">Nexus</span>
          </div>
        </Link>
        <div className="hidden md:flex space-x-8">
          {['Home', 'Features', 'Pricing', 'About', 'Contact'].map((item) => (
            <Link key={item} href="#" className="nav-link text-gray-700 hover:text-purple-600 transition">
              {item}
            </Link>
          ))}
        </div>
        <div className="hidden md:block">
          <button className="btn-primary text-white px-6 py-2 rounded-full font-medium shadow-lg" aria-label="Get Started">
            Get Started
          </button>
        </div>
        <div className="md:hidden">
          <button className="text-gray-700 focus:outline-none" aria-label="Menu">
            <FaBars className="text-xl" />
          </button>
        </div>
      </motion.nav>

      {/* Hero Section dengan 3D blob */}
      <section className="container mx-auto px-6 py-20 md:py-32 relative">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full h-[40vh] pointer-events-none">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }} shadows>
            <color attach="background" args={['#f5f7fa']} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 5, 10]} intensity={1.2} castShadow />
            <Suspense fallback={null}>
              <LiquidBlob position={[-1.2, 0.7, 0]} scale={[1.2, 1.1, 1.3]} />
              <LiquidBlob position={[1.5, 0.5, 0.2]} scale={[0.7, 0.8, 1.1]} />
              <Environment preset="city" />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} />
          </Canvas>
        </div>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeInVariants} className="flex flex-col md:flex-row items-center relative z-10">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="hero-text text-4xl md:text-6xl font-bold text-gray-800 leading-tight mb-6 drop-shadow">
              Build <span className="text-purple-600">Modern</span> Apps <br />
              With Ease
            </h1>
            <p className="text-gray-600 text-lg mb-8 max-w-lg">
              Nexus provides everything you need to create beautiful, high-performance web applications with modern technologies.
            </p>
            <div className="flex space-x-4">
              <button className="btn-primary text-white px-8 py-3 rounded-full font-medium flex items-center gap-2" aria-label="Get Started">
                Get Started <FaArrowRight className="ml-2" />
              </button>
              <button
                className="bg-white/30 backdrop-blur-lg border border-white/30 shadow-lg ring-1 ring-white/20 px-8 py-3 rounded-full font-medium text-gray-700 flex items-center gap-2"
                aria-label="Watch Demo"
              >
                <FaPlayCircle className="text-purple-600 mr-2" /> Watch Demo
              </button>
              <Link
                href="/login"
                className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition text-lg"
                aria-label="Login"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeInVariants} className="relative rounded-2xl p-6 glass-liquid-card">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-blue-400/40 via-white/10 to-purple-400/40 blur-xl opacity-80" />
              <div
                className="absolute inset-0 rounded-2xl border border-white/40 shadow-[0_4px_32px_0_rgba(80,80,255,0.10)] ring-1 ring-white/30"
                style={{ boxShadow: '0 8px 32px 0 rgba(80,80,255,0.18), 0 1.5px 8px 0 rgba(255,255,255,0.25) inset' }}
              />
              <Image
                src="https://illustrations.popsy.co/amber/web-development.svg"
                alt="Ilustrasi aplikasi web"
                width={500}
                height={500}
                className="w-full h-auto max-w-md relative z-10"
                priority
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeInVariants} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Amazing Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dirancang untuk membantu Anda membangun aplikasi yang lebih baik dengan lebih cepat dan efisien.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeInVariants} className="feature-card glass-liquid-card">
            <div className="feature-icon bg-purple-100 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <FaBolt className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Lightning Fast</h3>
            <p className="text-gray-600">Dioptimalkan untuk performa dengan overhead minimal dan efisiensi maksimal.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeInVariants} className="feature-card glass-liquid-card">
            <div className="feature-icon bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <FaCode className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Clean Code</h3>
            <p className="text-gray-600">Kode yang terstruktur dengan baik dan mudah dipelihara sesuai praktik terbaik.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeInVariants} className="feature-card glass-liquid-card">
            <div className="feature-icon bg-pink-100 text-pink-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <FaMobileAlt className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Responsive</h3>
            <p className="text-gray-600">Tampilan yang bagus di semua perangkat, dari mobile hingga desktop.</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeInVariants} className="glass-liquid-card rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/40 via-white/10 to-purple-400/40 rounded-2xl blur-xl opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Siap Mengubah Proyek Anda?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">Bergabunglah dengan ribuan pengembang yang telah merevolusi alur kerja mereka dengan platform kami.</p>
          <button className="btn-primary text-white px-8 py-3 rounded-full font-medium inline-flex items-center gap-2" aria-label="Mulai Uji Coba Gratis">
            Mulai Uji Coba Gratis <FaArrowRight className="ml-2" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <FaCube className="text-purple-600 text-xl mr-2" />
                <span className="font-bold text-gray-800 text-xl">Nexus</span>
              </div>
              <p className="text-gray-600 mt-2">Membangun masa depan, satu aplikasi pada satu waktu.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-gray-800 mb-4">Produk</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Fitur</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Harga</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Dokumentasi</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-4">Perusahaan</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Tentang</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Blog</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Karir</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-4">Sumber Daya</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Komunitas</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Dukungan</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-purple-600 transition">Kontak</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-4">Ikuti Kami</h4>
                <div className="flex space-x-4">
                  <Link href="#" className="text-gray-600 hover:text-purple-600 transition"><FaTwitter /></Link>
                  <Link href="#" className="text-gray-600 hover:text-purple-600 transition"><FaGithub /></Link>
                  <Link href="#" className="text-gray-600 hover:text-purple-600 transition"><FaLinkedin /></Link>
                  <Link href="#" className="text-gray-600 hover:text-purple-600 transition"><FaDiscord /></Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">© 2025 Nexus. Semua hak dilindungi.</p>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-600 hover:text-purple-600 transition">Kebijakan Privasi</Link>
              <Link href="#" className="text-gray-600 hover:text-purple-600 transition">Syarat Layanan</Link>
              <Link href="#" className="text-gray-600 hover:text-purple-600 transition">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
