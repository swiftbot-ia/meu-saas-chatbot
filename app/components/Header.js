'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const [showCTA, setShowCTA] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const firstSection = document.querySelector('section') || document.querySelector('main > div')
      
      if (firstSection) {
        const firstSectionBottom = firstSection.offsetTop + firstSection.offsetHeight
        const scrollPosition = window.scrollY
        setShowCTA(scrollPosition > firstSectionBottom - 100)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-center pt-4 px-4">
        {/* Desktop Header */}
        <div className="hidden md:flex backdrop-blur-md bg-[#2a2a2a]/85 rounded-full px-6 shadow-lg">
          <div className="flex items-center justify-between h-[56px] gap-40">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg width="32" height="32" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#04F5A0"/>
                  <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1141.901C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#04F5A0" stroke="#04F5A0" strokeWidth="1"/>
                </svg>
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">SwiftBot</span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link href="/precos" className="px-4 py-1.5 text-[14px] font-medium text-white/80 hover:text-white transition-colors duration-200">
                Preço
              </Link>
              
              <Link href="/login" className="px-4 py-1.5 text-[14px] font-medium text-white/80 hover:text-white transition-colors duration-200">
                Entrar
              </Link>

              <div className={`overflow-hidden transition-all duration-500 ease-out ${showCTA ? 'max-w-[200px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}`}>
                <Link href="/login" className="inline-flex items-center px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white text-[14px] font-medium rounded-full backdrop-blur-sm transition-all duration-200 whitespace-nowrap">
                  Testar de graça
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden w-full max-w-[500px]">
          <div className="backdrop-blur-md bg-[#2a2a2a]/85 shadow-lg rounded-[28px] overflow-hidden">
            {/* Header fixo */}
            <div className="flex items-center justify-between h-[52px] px-5">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#04F5A0"/>
                    <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1141.901C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#04F5A0" stroke="#04F5A0" strokeWidth="1"/>
                  </svg>
                </div>
                <span className="text-base font-semibold text-white">SwiftBot</span>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex flex-col gap-1 w-6 h-6 items-center justify-center"
                aria-label="Menu"
              >
                <span className="w-5 h-0.5 bg-white rounded-full"></span>
                <span className="w-5 h-0.5 bg-white rounded-full"></span>
              </button>
            </div>

            {/* Dropdown Menu (cortina caindo) */}
            <div className={`transition-all duration-300 ease-out ${mobileMenuOpen ? 'max-h-[400px]' : 'max-h-0'}`}>
              <div className="px-5 pb-5 pt-2">
                <nav className="flex flex-col gap-1">
                  <Link 
                    href="/precos" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    Preço
                  </Link>
                  
                  <Link 
                    href="/faq" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    FAQ
                  </Link>
                  
                  <Link 
                    href="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    Login
                  </Link>
                  
                  <Link 
                    href="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 px-4 py-3 text-[15px] font-semibold text-black bg-[#04F5A0] hover:bg-[#03E691] rounded-xl transition-all text-center"
                  >
                    Testar de graça
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </>
  )
}