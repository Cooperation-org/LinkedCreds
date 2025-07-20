/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { FormControl, Box, Slide, Button, Typography } from '@mui/material'
import { FormData } from './types/Types'
import { Step0 } from './Steps/Step0_connectToGoogle'
import { Buttons } from './buttons/Buttons'
import DataComponent from './Steps/dataPreview'
import { createDID, signCred } from '../../utils/signCred'
import { GoogleDriveStorage, saveToGoogleDrive } from '@cooperation/vc-storage'
import { useSession, signIn } from 'next-auth/react'
import { handleSign } from '../../utils/formUtils'
import { saveSession } from '../../utils/saveSession'
import SnackMessage from '../../components/SnackMessage'
import { useStepContext } from './StepContext'
import SuccessPage from './Steps/SuccessPage'
import FileUploadAndList from './Steps/Step3_uploadEvidence'
import { Step1 } from './Steps/Step1_userName'
import { Step2 } from './Steps/Step2_descreptionFields'
import { storeFileTokens } from '../../firebase/storage'
import CredentialTracker from '../../components/credetialTracker/Page'

const Form = ({ onStepChange }: any) => {
  const { activeStep, handleNext, handleBack, setActiveStep, loading, handleSkip } =
    useStepContext()
  const [prevStep, setPrevStep] = useState(0)
  const [link, setLink] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [hasSignedIn, setHasSignedIn] = useState(false)
  const [snackMessage, setSnackMessage] = useState('')
  const [userSessions, setUserSessions] = useState<{}[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [fileId, setFileId] = useState('')
  const [image, setImage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<any[]>([])
  const [res, setRes] = useState<any>(null)

  const characterLimit = 294
  const { data: session } = useSession()
  const accessToken = session?.accessToken
  const refreshToken = session?.refreshToken

  const storage = new GoogleDriveStorage(accessToken as string)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    trigger,
    formState: { errors, isValid }
  } = useForm<FormData>({
    defaultValues: {
      storageOption: 'Google Drive',
      fullName: session?.user?.name ?? '',
      persons: '',
      credentialName: '',
      credentialDuration: '',
      credentialDescription: '',
      portfolio: [],
      evidenceLink: '',
      description: ''
    },
    mode: 'onChange'
  })

  useEffect(() => {
    setPrevStep(activeStep + 1)
  }, [activeStep])

  const direction = activeStep > prevStep ? 'left' : 'right'

  const handleFetchinguserSessions = async () => {
    try {
      if (!accessToken) return
      const sessionFiles = await storage.getAllFilesByType('SESSIONs')
      if (!sessionFiles || sessionFiles.length === 0) return
      console.log('userSessions', sessionFiles)
      if (sessionFiles.length > 0) {
        setUserSessions(sessionFiles)
        setOpenDialog(true)
      }
    } catch (err) {
      console.error('Failed to fetch userSessions:', err)
      setErrorMessage('Failed to fetch user sessions')
    }
  }

  const handleuserSessionselect = (session: any) => {
    // Set the selected session values into the form
    setValue('fullName', session.fullName)
    setValue('persons', session.persons)
    setValue('credentialName', session.credentialName)
    setValue('credentialDuration', session.credentialDuration)
    setValue('credentialDescription', session.credentialDescription)
    setValue('portfolio', session.portfolio)
    setValue('evidenceLink', session?.evidenceLink)
    setValue('description', session.description)

    // Close the dialog
    setOpenDialog(false)
  }

  useEffect(() => {
    onStepChange()
  }, [activeStep])

  useEffect(() => {
    handleFetchinguserSessions()
  }, [])

  // Check for imported form data from credential import
  useEffect(() => {
    const importedData = localStorage.getItem('importedFormData')
    if (importedData) {
      try {
        const formData = JSON.parse(importedData)
        console.log('Loading imported form data:', formData)

        // Populate form fields with imported data
        if (formData.fullName) setValue('fullName', formData.fullName)
        if (formData.persons) setValue('persons', formData.persons)
        if (formData.credentialName) setValue('credentialName', formData.credentialName)
        if (formData.credentialDuration)
          setValue('credentialDuration', formData.credentialDuration)
        if (formData.credentialDescription)
          setValue('credentialDescription', formData.credentialDescription)
        if (formData.portfolio) setValue('portfolio', formData.portfolio)
        if (formData.evidenceLink) setValue('evidenceLink', formData.evidenceLink)
        if (formData.description) setValue('description', formData.description)
        if (formData.storageOption) setValue('storageOption', formData.storageOption)

        // Clear the imported data from localStorage after loading
        localStorage.removeItem('importedFormData')
      } catch (error) {
        console.error('Failed to parse imported form data:', error)
        localStorage.removeItem('importedFormData')
      }
    }
  }, [])

  const costumedHandleNextStep = async () => {
    if (
      activeStep === 0 &&
      watch('storageOption') === 'Google Drive' &&
      !accessToken &&
      !hasSignedIn
    ) {
      const signInSuccess = await signIn('google')
      if (!signInSuccess || !accessToken) return
      setHasSignedIn(true)
      handleNext()
    } else {
      handleNext()
    }
  }

  const costumedHandleBackStep = async () => {
    if (activeStep > 0) {
      handleBack()
      await trigger()
    }
  }

  const handleFormSubmit = handleSubmit(async (data: FormData) => {
    try {
      await sign(data)
    } catch (error: any) {
      if (error.message === 'MetaMask address could not be retrieved') {
        setErrorMessage('Please make sure you have MetaMask installed and connected.')
        return
      } else {
        console.log('Error during VC signing:', error)
        setErrorMessage('An error occurred during the signing process.')
      }
    }
  })

  const sign = async (data: any) => {
    try {
      if (!accessToken) {
        setErrorMessage('Access token is missing')
        return
      }

      const { didDocument, keyPair, issuerId } = await createDID(accessToken)

      const saveResponse = await saveToGoogleDrive({
        storage,
        data: {
          didDocument,
          keyPair
        },
        type: 'DID'
      })
      console.log('🚀 ~ sign ~ saveResponse:', saveResponse)

      const res = await signCred(accessToken, data, issuerId, keyPair, 'VC')
      const file = (await saveToGoogleDrive({
        storage,
        data: res,
        type: 'VC'
      })) as any
      try {
        const savedFile = await storeFileTokens({
          googleFileId: file.id,
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken as string
          }
        })

        localStorage.removeItem('vcs')
      } catch (error) {
        console.error('Error storing file tokens:', error)
        throw error
      }

      const folderIds = await storage?.getFileParents(file.id)
      const relationFile = await storage?.createRelationsFile({
        vcFolderId: folderIds[0]
      })
      setLink(`https://drive.google.com/file/d/${file.id}/view`)
      setFileId(`${file.id}`)

      console.log('🚀 ~ handleFormSubmit ~ res:', res)
      setRes(res)
      return res
    } catch (error: any) {
      console.error('Error during signing process:', error)
      throw error
    }
  }

  const handleSaveSession = async () => {
    try {
      const formData = watch() // Get the current form data
      setSnackMessage('Successfully saved in Your ' + formData.storageOption)
      if (!accessToken) {
        setErrorMessage('Access token is missing')
        return
      }
      await saveSession(formData, accessToken) // Save session data to Google Drive
    } catch (error: any) {
      setSnackMessage('Someting went wrong, please try agin later')
      console.error('Error saving session:', error)
    }
  }

  return (
    <Box
      sx={{
        m: { xs: '50px auto', sm: '50px auto', md: '120px auto' },
        display: 'flex',
        gap: '90px',
        alignItems: 'flex-start',
        justifyContent: 'center'
      }}
    >
      <form
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          alignItems: 'center',
          justifyItems: 'center',
          padding: ' 20px 20px 20px',
          overflow: 'auto',
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#FFF'
        }}
        onSubmit={handleFormSubmit}
      >
        <Box
          sx={{
            width: '100%',
            minWidth: { md: '400px' },
            maxWidth: { md: '720px' }
          }}
        >
          <FormControl sx={{ width: '100%' }}>
            {activeStep === 0 && (
              <Slide in={true} direction={direction} timeout={500}>
                <Box>
                  <Step0 />
                </Box>
              </Slide>
            )}
            {activeStep === 1 && (
              <Slide in={true} direction={direction} timeout={500}>
                <Box>
                  <Step1
                    watch={watch}
                    setValue={setValue}
                    register={register}
                    errors={errors}
                    handleNext={handleNext}
                  />
                </Box>
              </Slide>
            )}

            {activeStep === 2 && (
              <Slide in={true} direction={direction}>
                <Box>
                  <Step2
                    register={register}
                    watch={watch}
                    handleTextEditorChange={value =>
                      setValue('credentialDescription', value ?? '')
                    }
                    errors={errors}
                    control={control}
                  />
                </Box>
              </Slide>
            )}
            {activeStep === 3 && (
              <Box
                sx={{
                  width: '100%',
                  maxWidth: { md: '720px' },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <FileUploadAndList
                  watch={watch}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  setValue={setValue}
                />
              </Box>
            )}
            {activeStep === 4 && (
              <Slide in={true} direction={direction}>
                <Box>
                  <DataComponent formData={watch()} selectedFiles={selectedFiles} />
                </Box>
              </Slide>
            )}
            {activeStep === 5 && (
              <Slide in={true} direction={direction}>
                <Box>
                  <SuccessPage
                    formData={watch()}
                    setActiveStep={setActiveStep}
                    reset={reset}
                    link={link}
                    setLink={setLink}
                    setFileId={setFileId}
                    fileId={fileId}
                    storageOption={watch('storageOption')}
                    selectedImage={image}
                    res={res}
                  />
                </Box>
              </Slide>
            )}
          </FormControl>
        </Box>
        {activeStep !== 5 && (
          <Buttons
            activeStep={activeStep}
            handleNext={activeStep === 0 ? costumedHandleNextStep : () => handleNext()}
            handleSkip={handleSkip}
            handleSign={() => handleSign(activeStep, setActiveStep, handleFormSubmit)}
            handleBack={costumedHandleBackStep}
            isValid={isValid}
            handleSaveSession={handleSaveSession}
            loading={loading}
          />
        )}
        {errorMessage && (
          <div
            style={{
              color: errorMessage.includes('MetaMask') ? 'red' : 'black',
              textAlign: 'center',
              marginTop: '20px'
            }}
          >
            {errorMessage}
          </div>
        )}
        {snackMessage ? <SnackMessage message={snackMessage} /> : ''}
      </form>

      {activeStep >= 1 && activeStep <= 4 && (
        <CredentialTracker formData={watch()} selectedFiles={selectedFiles} />
      )}
    </Box>
  )
}
export default Form
