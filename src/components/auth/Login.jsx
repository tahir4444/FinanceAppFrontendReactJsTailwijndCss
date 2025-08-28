import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = memo(() => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
  });
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // The AuthContext will handle the role-based redirect
      // This effect is just to prevent staying on login page if already authenticated
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = useCallback(async (data) => {
    try {
      await login(data.email, data.password);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  }, [login]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
        <input
          id="email"
          type="email"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-gray-50 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          placeholder="Enter your email"
          autoComplete="email"
        />
        {errors.email && (
          <div className="text-red-500 text-xs mt-1">{errors.email.message}</div>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-gray-50 pr-10 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12.001C3.226 16.273 7.24 19.5 12 19.5c1.658 0 3.237-.335 4.646-.94M21.07 15.977A10.45 10.45 0 0022.066 12c-1.292-4.273-5.306-7.5-10.066-7.5-1.522 0-2.98.304-4.28.85M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.86-.7 1.664-1.25 2.385M15.54 15.54A5.978 5.978 0 0112 17c-3.314 0-6-2.686-6-6 0-.795.155-1.552.437-2.24" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <div className="text-red-500 text-xs mt-1">{errors.password.message}</div>
        )}
        <div className="flex justify-end mt-2">
          <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
        </div>
      </div>

      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          id="remember-me"
          name="remember-me"
        />
        <label className="ml-2 block text-sm text-gray-600" htmlFor="remember-me">Remember me</label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2 inline-block text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
});

Login.displayName = 'Login';

export default Login;
