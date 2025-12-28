import * as Yup from 'yup'

export const loginSchema = Yup.object().shape({
    username: Yup.string()
        .trim()
        .required('Username is required'),
    password: Yup.string().trim()
        .required('Password is required'),
})

export const signupSchema = Yup.object().shape({
    username: Yup.string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(150, 'Username must be less than 150 characters')
        .required('Username is required'),
    email: Yup.string()
        .trim()
        .email('Please enter a valid email address')
        .required('Email is required'),
    phone_number: Yup.string()
        .trim()
        .matches(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number')
        .required('Phone number is required'),
    password: Yup.string()
        .trim()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .trim()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    referred_by: Yup.string()
        .trim()
        .optional(),
    acceptTerms: Yup.boolean()
        .oneOf([true], 'You must accept the terms and conditions')
        .required('You must accept the terms and conditions'),
})

export const forgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
        .trim()
        .email('Please enter a valid email address')
        .required('Email is required'),
})

export const resetPasswordSchema = Yup.object().shape({
    new_password: Yup.string()
        .trim()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirm_password: Yup.string()
        .trim()
        .oneOf([Yup.ref('new_password')], 'Passwords must match')
        .required('Please confirm your password'),
})

// Export default as loginSchema for backward compatibility
export const schema = loginSchema