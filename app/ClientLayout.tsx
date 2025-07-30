'use client'

import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import NavBar from './components/navbar/NavBar'
import Footer from './components/footer/Footer'
import Theme from './theme'
import { StepProvider } from './credentialForm/form/StepContext'
import { usePathname } from 'next/navigation'
import background from './Assets/Images/Background.svg'
import Providers from './components/signing/Providers'
import AppDidInitializer from './components/AppDidInitializer'

export default function ClientLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()

  return (
    <body
      style={{
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}
    >
      <ThemeProvider theme={Theme}>
        <CssBaseline />
        <Providers>
          <StepProvider>
            <NavBar />
            <Box
              component='main'
              sx={{
                flexGrow: 1,
                minHeight: `calc(100vh - 315px)`,
                backgroundImage: pathname === '/' ? `url(${background.src})` : 'none',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                pb: '60px',
                backgroundBlendMode: pathname === '/' ? 'overlay' : 'normal',
                backgroundColor:
                  pathname === '/'
                    ? {
                        xs: 'rgba(255, 255, 255, 0.8)',
                        md: 'rgba(255, 255, 255, 0.85)'
                      }
                    : '#F0F4F8'
              }}
            >
              <AppDidInitializer />
              {children}
            </Box>
            <Footer />
          </StepProvider>
        </Providers>
      </ThemeProvider>
    </body>
  )
}
