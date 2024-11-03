'use client'

import React from 'react'
import { FormLabel, Autocomplete, TextField, Box, Typography } from '@mui/material'
import {
  inputPropsStyles,
  TextFieldStyles,
  formLabelStyles,
  CustomTextField,
  customTextFieldStyles,
  aiBoxStyles,
  UseAIStyles
} from '../../../components/Styles/appStyles'
import { UseFormRegister, FieldErrors, Controller } from 'react-hook-form'
import { FormData } from '../types/Types'
import { StepTrackShape } from '../fromTexts & stepTrack/StepTrackShape'
import { SVGDescribeBadge, SVGSparkles } from '../../../Assets/SVGs'

interface Step2Props {
  register: UseFormRegister<FormData>
  watch: (field: string) => any
  handleTextEditorChange: (value: any) => void
  errors: FieldErrors<FormData>
  control: any
}

// Example list of skills for auto-search
const skillsList = [
  'Software Developer',
  'Project Manager',
  'Data Analyst',
  'Marketing Coordinator',
  'Community Gardening Coordinator',
  'UX/UI Designer',
  'Product Manager',
  'Financial Analyst'
]

export function Step2({ register, watch, control, errors }: Readonly<Step2Props>) {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}
    >
      <SVGDescribeBadge />
      <Typography sx={{ fontFamily: 'Lato', fontSize: '24px', fontWeight: 400 }}>
        Describe your skill.{' '}
      </Typography>
      <StepTrackShape />
      <Box sx={{ width: '100%' }}>
        <FormLabel sx={formLabelStyles} id='name-label'>
          Skill Name (required):
        </FormLabel>

        <Controller
          name='credentialName'
          control={control}
          rules={{ required: 'Skill name is required' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Autocomplete
              freeSolo
              options={skillsList}
              value={value || ''}
              onChange={(event, newValue) => {
                onChange(newValue)
              }}
              onInputChange={(event, newInputValue) => {
                onChange(newInputValue)
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder='e.g., Community Gardening Coordinator'
                  variant='outlined'
                  sx={TextFieldStyles}
                  aria-labelledby='name-label'
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': 'skill-name',
                    style: inputPropsStyles
                  }}
                  error={!!error}
                  helperText={error ? error.message : ''}
                />
              )}
            />
          )}
        />
      </Box>

      <Box sx={{ width: '100%' }}>
        <FormLabel sx={formLabelStyles} id='duration-label'>
          Time spent acquiring this skill:{' '}
        </FormLabel>
        <TextField
          {...register('credentialDuration')}
          placeholder='I learned these skills through working at a community garden for 2 years, under the head gardener Maria Hernandez'
          variant='outlined'
          sx={TextFieldStyles}
          aria-labelledby='duration-label'
          inputProps={{
            'aria-label': 'weight',
            style: inputPropsStyles
          }}
          error={!!errors.credentialDuration}
          helperText={errors.credentialDuration?.message}
        />
      </Box>

      <Box position='relative' width='100%'>
        <FormLabel sx={formLabelStyles} id='description-label'>
          Skill description (required):{' '}
        </FormLabel>
        <CustomTextField
          {...register('credentialDescription', {
            required: 'Credential Description is required'
          })}
          sx={customTextFieldStyles}
          multiline
          rows={11}
          variant='outlined'
          placeholder={
            'Example:\nWatering and feeding on a routine schedule, diagnosing plant sickness, over/under watering, removing dead leaves, and cultivating rich soil.'
          }
          FormHelperTextProps={{
            className: 'MuiFormHelperText-root'
          }}
          inputProps={{ maxLength: 294 }}
          error={!!errors.credentialDescription}
          helperText={
            errors.credentialDescription?.message
              ? `${errors.credentialDescription.message}`
              : `${watch('credentialDescription').length}/${294} characters`
          }
        />
        <Box sx={aiBoxStyles}>
          <SVGSparkles />
          <FormLabel sx={UseAIStyles} id='ai-description-label'>
            Use AI to generate a description.
          </FormLabel>
        </Box>
      </Box>
      <Box position='relative' width='100%'>
        <FormLabel sx={formLabelStyles} id='description-label'>
          Describe how you earned this skill (required):{' '}
        </FormLabel>
        <CustomTextField
          {...register('description', {
            required: 'Description is required'
          })}
          sx={customTextFieldStyles}
          multiline
          rows={11}
          variant='outlined'
          placeholder={
            'Example:\nI have been a weekly volunteer at the Beloved NC garden for the past 3 years in addition to caring for my own personal garden.'
          }
          FormHelperTextProps={{
            className: 'MuiFormHelperText-root'
          }}
          inputProps={{ maxLength: 294 }}
          error={!!errors.description}
          helperText={
            errors.description?.message
              ? `${errors.description.message}`
              : `${watch('description').length}/${294} characters`
          }
        />
      </Box>
    </Box>
  )
}
