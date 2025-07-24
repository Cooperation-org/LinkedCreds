import { useTheme } from '@mui/material/styles'
import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import HamburgerMenu from '../hamburgerMenu/HamburgerMenu'
import { Logo } from '../../Assets/SVGs'
import router from 'next/router'

const NavBar = () => {
  const theme = useTheme()
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (path: string): boolean => pathname === path
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      localStorage.clear()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      localStorage.clear()
      router.push('/')
    }
  }

  return (
    <Box
      sx={{
        width: '100vw',
        height: { xs: '27px', md: '100px' },
        display: 'flex',
        position: 'sticky',
        alignItems: 'center',
        backgroundColor: 'white',
        justifyContent: 'space-between',
        my: { xs: '18px', md: '0px' },
        boxShadow: {
          md: '0px 4px 10px rgba(209, 213, 219, 0.5)'
        }
      }}
    >
      {/* Logo and Name */}
      <Box
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          pl: { xs: '15px', md: '9.6vw' }
        }}
      >
        <Link href='/' aria-label='LinkedCreds Home'>
          <Box sx={{ display: 'flex', alignItems: 'center', marginRight: '0px' }}>
            <Logo />
          </Box>
        </Link>
        <Link href='/' aria-label='LinkedCreds Home'>
          <Typography
            sx={{
              fontWeight: '700',
              fontSize: { xs: '18px', md: '24px' },
              color: theme.palette.t3DarkSlateBlue,
              fontFamily: 'inter'
            }}
          >
            LinkedCreds
          </Typography>
        </Link>
      </Box>
      <Box sx={{ width: '100%' }}></Box>

      {/* Navigation Links and Sign Button */}
      <Box
        sx={{
          width: '55%',
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: session ? 'space-between' : 'flex-end',
          mr: { xs: '15px', md: '10.938vw' },
          gap: '3.9vw',
          textWrap: 'nowrap'
        }}
      >
        {session && (
          <>
            <Link href='/credentialForm' passHref>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: isActive('/credentialForm') ? '600' : '400',
                    color: isActive('/credentialForm')
                      ? '#003FE0'
                      : theme.palette.t3DarkSlateBlue,
                    cursor: 'pointer'
                  }}
                >
                  Add a New Skill
                </Typography>
                {isActive('/credentialForm') && (
                  <Box
                    sx={{
                      height: '2px',
                      width: '100%',
                      mt: '5px',
                      backgroundColor: '#003FE0'
                    }}
                  />
                )}
              </Box>
            </Link>
            <Link href='/credentialImportForm' passHref>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: isActive('/credentialImportForm') ? '600' : '400',
                    color: isActive('/credentialImportForm')
                      ? '#003FE0'
                      : theme.palette.t3DarkSlateBlue,
                    cursor: 'pointer'
                  }}
                >
                  Import Skill Credential
                </Typography>
                {isActive('/credentialImportForm') && (
                  <Box
                    sx={{
                      height: '2px',
                      width: '100%',
                      mt: '5px',
                      backgroundColor: '#003FE0'
                    }}
                  />
                )}
              </Box>
            </Link>
            <Link href='/claims' passHref>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: isActive('/claims') ? '600' : '400',
                    color: isActive('/claims')
                      ? '#003FE0'
                      : theme.palette.t3DarkSlateBlue,
                    cursor: 'pointer'
                  }}
                >
                  My Skills
                </Typography>
                {isActive('/claims') && (
                  <Box
                    sx={{
                      height: '2px',
                      width: '100%',
                      mt: '5px',
                      backgroundColor: '#003FE0'
                    }}
                  />
                )}
              </Box>
            </Link>
            <Link href='/analytics' passHref>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: isActive('/analytics') ? '600' : '400',
                    color: isActive('/analytics')
                      ? '#003FE0'
                      : theme.palette.t3DarkSlateBlue,
                    cursor: 'pointer'
                  }}
                >
                  Analytics
                </Typography>
                {isActive('/analytics') && (
                  <Box
                    sx={{
                      height: '2px',
                      width: '100%',
                      mt: '5px',
                      backgroundColor: '#003FE0'
                    }}
                  />
                )}
              </Box>
            </Link>

            {/* Uncomment these links when needed */}
            {/* 
            <Link href='/about' passHref>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: isActive('/about') ? '600' : '400',
                    color: isActive('/about') ? '#003FE0' : theme.palette.t3DarkSlateBlue,
                    cursor: 'pointer'
                  }}
                >
                  About LinkedCreds
                </Typography>
                {isActive('/about') && (
                  <Box sx={{ height: '2px', width: '100%', mt: '5px', backgroundColor: '#003FE0' }} />
                )}
              </Box>
            </Link>
            <Link href='/support' passHref>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: isActive('/support') ? '600' : '400',
                    color: isActive('/support') ? '#003FE0' : theme.palette.t3DarkSlateBlue,
                    cursor: 'pointer'
                  }}
                >
                  Support
                </Typography>
                {isActive('/support') && (
                  <Box sx={{ height: '2px', width: '100%', mt: '5px', backgroundColor: '#003FE0' }} />
                )}
              </Box>
            </Link>
            */}
          </>
        )}

        {/* Sign In/Out Button */}
        {session ? (
          <Button
            sx={{
              width: '148px',
              fontFamily: 'roboto',
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '20px',
              textAlign: 'center',
              justifyContent: 'center'
            }}
            variant='actionButton'
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        ) : (
          <Button
            sx={{
              width: '148px',
              fontFamily: 'roboto',
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '20px',
              textAlign: 'center',
              justifyContent: 'center'
            }}
            variant='actionButton'
            onClick={() => signIn('google')}
          >
            Sign In
          </Button>
        )}
      </Box>

      {/* Small Screen - Hamburger Menu */}
      <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
        <HamburgerMenu aria-label='Open menu' />
      </Box>
    </Box>
  )
}

export default NavBar
