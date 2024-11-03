import { styled, TextField, Theme } from '@mui/material'
import { SxProps } from '@mui/material/styles'

export const StyledButton = {
  padding: '10px 24px',
  borderRadius: '100px',
  textTransform: 'capitalize',
  fontFamily: 'Roboto',
  fontWeight: '600',
  lineHeight: '20px',
  border: '1px solid  #003FE0',
  color: '#003FE0',
  '&:hover': {
    backgroundColor: '#eff6ff'
  },
  backgroundColor: '#eff6ff'
}

export const nextButtonStyle = {
  padding: '10px 24px',
  borderRadius: '100px',
  textTransform: 'capitalize',
  fontFamily: 'Roboto',
  fontWeight: '500',
  lineHeight: '20px',
  backgroundColor: '#003FE0',
  color: '#FFFFFF',
  flexGrow: 8,
  fontSize: '14px',
  width: 'fit-content',
  maxWidth: '230px'
}

export const CustomTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    position: 'relative',
    paddingRight: '50px',
    width: '100%',
    height: '275px',
    marginTop: '3px'
  },
  '& .MuiFormHelperText-root': {
    position: 'absolute',
    bottom: 8,
    right: 16,
    fontSize: '0.75rem',
    borderRadius: '28px'
  }
})

export const formLabelStyles = {
  color: 't3BodyText',
  fontFamily: 'Lato',
  fontSize: '16px',
  fontWeight: 600,
  letterSpacing: '0.08px',
  mb: '7px',
  '&.Mui-focused': {
    color: 't3Black'
  }
}

export const TextFieldStyles = {
  bgcolor: '#FFF',
  width: '100%',
  mt: '3px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px'
  }
}

export const inputPropsStyles = {
  color: 'black',
  fontSize: '15px',
  fontStyle: 'italic',
  letterSpacing: '0.075px'
}

export const buttonLinkStyles = {
  background: 'none',
  color: 't3Purple',
  border: 'none',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 400
}

export const UseAIStyles = {
  color: 't3BodyText',
  fontFamily: 'Lato',
  fontSize: '13px',
  textDecorationLine: 'underline',
  lineHeight: '24px',
  letterSpacing: '0.065px',
  fontWeight: 400,
  '&.Mui-focused': {
    color: '#000'
  }
}

export const commonTypographyStyles = {
  color: 't3BodyText',
  fontSize: '15px',
  fontWeight: 400,
  fontStyle: 'normal'
}

export const commonBoxStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  justifyContent: 'center'
}

export const evidenceListStyles = {
  marginLeft: '25px',
  textDecorationLine: 'underline',
  color: 'blue',
  backGroundColor: '#FFFFFF'
}

export const credentialBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  padding: '2px 5px',
  borderRadius: '5px',
  width: 'fit-content',
  mb: '10px'
}

export const imageBoxStyles = {
  borderRadius: '2px'
}

export const radioCheckedStyles = {
  '&.Mui-checked': {
    color: 't3CheckboxBorderActive'
  }
}

export const radioGroupStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  m: '0 auto',
  width: '100%',
  pl: '10px',
  maxWidth: '355px',
  alignItems: 'center'
}

export const radioGroupStep1Styles = {
  display: 'flex',
  flexDirection: {
    xs: 'column',
    sm: 'row',
    md: 'row'
  },
  gap: '15px',
  m: '0 auto',
  width: '100%',
  ml: '10px'
}

export const textFieldInputProps = {
  'aria-label': 'weight',
  style: {
    color: 't3Black',
    fontSize: '15px',
    fontStyle: 'italic',
    letterSpacing: '0.075px'
  }
}

export const stepBoxContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
}

export const formLabelSpanStyles = {
  color: 'red'
}

export const customTextFieldStyles = {
  width: '100%',
  marginBottom: '3px',
  textAlign: 'left'
}

export const aiBoxStyles = {
  display: 'flex',
  gap: '5px'
}

export const portfolioTypographyStyles = {
  color: 't3BodyText',
  fontFamily: 'Lato',
  fontSize: '20px',
  fontWeight: 700,
  display: 'flex',
  justifyContent: 'space-between',
  mb: '10px'
}

export const addAnotherButtonStyles = (theme: Theme) => ({
  textTransform: 'none',
  width: '100%',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& .MuiButton-endIcon': {
    marginRight: '0'
  },
  '&:hover': {
    backgroundColor: 'transparent',
    textDecoration: 'underline'
  }
})

export const addAnotherIconStyles = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: `1px solid #2563EB`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& .MuiSvgIcon-root': {
    fontSize: '16px'
  }
}

export const addAnotherBoxStyles = {
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-start'
}

export const skipButtonBoxStyles = {
  width: '100%',
  justifyContent: 'center',
  display: 'flex',
  alignItems: 'center'
}

export const skipButtonStyles = (theme: Theme): SxProps<Theme> => ({
  fontWeight: 'bold',
  color: '#1F2937',
  textDecoration: 'none'
})
export const formBoxStyles = {
  marginBottom: '15px'
}

export const formBoxStylesUrl = {
  marginBottom: '25px'
}

export const successPageContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '100%',
  borderRadius: '20px',
  gap: '30px'
}

export const successPageHeaderStyles = {
  width: '100%',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  backgroundColor: '#e6f0fd',
  borderRadius: '20px',
  padding: '0 15px 0 0'
}

export const successPageImageStyles = {
  width: '100px',
  height: '100%'
}

export const successPageInnerBoxStyles = {
  width: '100%',
  textAlign: 'right',
  pr: '15px',
  mt: '5px'
}

export const successPageTitleStyles = {
  color: '#202E5B',
  textAlign: 'left',
  fontFamily: 'Inter, sans-serif',
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '0.09px',
  textTransform: 'capitalize'
}

export const successPageInfoStyles = {
  display: 'flex',
  gap: '3px',
  marginTop: '5px',
  alignItems: 'center',
  background: '#d5e1fb',
  width: 'fit-content',
  p: '3px'
}

export const successPageDateStyles = {
  color: '#4E4E4E',
  background: '#d5e1fb',
  textAlign: 'center',
  fontFamily: 'Poppins, sans-serif',
  fontSize: '13px',
  fontWeight: 400,
  lineHeight: '150%'
}

export const successPageShareStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '10px 21px'
}

export const successPageShareTextStyles = {
  color: '#202e5b',
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  fontSize: '15px',
  letterSpacing: '0.075px',
  mr: '5px'
}

export const successPageIconContainerStyles = {
  backgroundColor: '#e6f0fd',
  borderRadius: '20px',
  height: '40px',
  width: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

export const successPageCopyLinkStyles = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  bgcolor: '#FBFBFB',
  mt: '6px'
}

export const successPageCopyLinkTextStyles = {
  color: '#202e5b',
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  fontSize: '15px',
  letterSpacing: '0.075px',
  mr: '10px'
}

export const successPageTextFieldStyles = {
  flex: 1,
  borderRadius: '5px',
  '& .MuiInputBase-root': {
    color: '#6B7280',
    fontSize: '15px',
    letterSpacing: '0.075px',
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center',
    bgcolor: '#FFFFFF'
  }
}

export const successPageButtonStyles = {
  display: 'flex',
  ml: 'auto',
  mr: 'auto',
  marginTop: '22px',
  alignContent: 'center',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 24px',
  width: '127px',
  height: '40px',
  borderRadius: '100px',
  backgroundColor: '#003FE0',
  textTransform: 'capitalize',
  fontFamily: 'Roboto, sans-serif',
  lineHeight: '20px',
  '&:hover': {
    backgroundColor: '#3182ce'
  }
}

export const stepTrackContainerStyles = {
  width: '100%',
  display: 'flex',
  gap: '5px',
  justifyContent: 'center'
}

export const stepTrackBoxStyles = (width: string) => ({
  width: width,
  height: '5px',
  bgcolor: 't3BodyText',
  borderRadius: '3px'
})
