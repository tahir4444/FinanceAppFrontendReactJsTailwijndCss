import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axios';

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
  } = useForm();
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Use a public endpoint or modify the backend to allow fetching users without auth
        const response = await axiosInstance.get('/auth/users');
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Don't show error toast as this is not critical
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateFileSize = (file) => {
    if (file && file[0]) {
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file[0].size > maxSize) {
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (data) => {
    try {
      // Validate file sizes
      if (data.pan_card && !validateFileSize(data.pan_card)) {
        setError('pan_card', {
          type: 'manual',
          message: 'PAN card image must be less than 2MB',
        });
        return;
      }
      if (data.voter_card && !validateFileSize(data.voter_card)) {
        setError('voter_card', {
          type: 'manual',
          message: 'Voter card image must be less than 2MB',
        });
        return;
      }
      if (data.adhaar_card && !validateFileSize(data.adhaar_card)) {
        setError('adhaar_card', {
          type: 'manual',
          message: 'Aadhaar card image must be less than 2MB',
        });
        return;
      }

      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (
          (key === 'profile_pic' ||
            key === 'bank_check' ||
            key === 'pan_card' ||
            key === 'voter_card' ||
            key === 'adhaar_card') &&
          data[key]?.[0]
        ) {
          formData.append(key, data[key][0]);
        } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      await registerUser(formData);
      toast.success('Registration successful! Welcome to your dashboard.');
    } catch (error) {
      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;

      if (errors) {
        // Handle validation errors from backend
        errors.forEach((err) => {
          setError(err.param, {
            type: 'manual',
            message: err.msg,
          });
        });
      } else if (message) {
        // Handle other backend errors (e.g., 'User already exists')
        toast.error(message);
      } else {
        // Handle generic errors
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          {...register('name', { required: 'Name is required' })}
          placeholder="John Doe"
        />
        {errors.name && (
          <div className="invalid-feedback">{errors.name.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          placeholder="you@example.com"
        />
        {errors.email && (
          <div className="invalid-feedback">{errors.email.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="mobile" className="form-label">
          Mobile Number
        </label>
        <input
          id="mobile"
          type="tel"
          className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
          {...register('mobile', {
            required: 'Mobile number is required',
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Please enter a valid 10-digit mobile number',
            },
          })}
          placeholder="1234567890"
        />
        {errors.mobile && (
          <div className="invalid-feedback">{errors.mobile.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="address" className="form-label">
          Address
        </label>
        <textarea
          id="address"
          className={`form-control ${errors.address ? 'is-invalid' : ''}`}
          {...register('address', { required: 'Address is required' })}
          placeholder="Enter your address"
          rows="3"
        />
        {errors.address && (
          <div className="invalid-feedback">{errors.address.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="profile_pic" className="form-label">
          Profile Picture
        </label>
        <input
          id="profile_pic"
          type="file"
          className={`form-control ${errors.profile_pic ? 'is-invalid' : ''}`}
          {...register('profile_pic')}
          accept="image/*"
        />
        {errors.profile_pic && (
          <div className="invalid-feedback">{errors.profile_pic.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="adhaar_card" className="form-label">
          Aadhaar Card
        </label>
        <input
          id="adhaar_card"
          type="file"
          className={`form-control ${errors.adhaar_card ? 'is-invalid' : ''}`}
          {...register('adhaar_card', {
            validate: {
              fileSize: (value) => {
                if (value && value[0]) {
                  return (
                    value[0].size <= 2 * 1024 * 1024 ||
                    'File size must be less than 2MB'
                  );
                }
                return true;
              },
              fileType: (value) => {
                if (value && value[0]) {
                  return (
                    ['image/jpeg', 'image/png', 'image/jpg'].includes(
                      value[0].type
                    ) || 'Only JPG, JPEG & PNG files are allowed'
                  );
                }
                return true;
              },
            },
          })}
          accept="image/jpeg,image/png,image/jpg"
        />
        {errors.adhaar_card && (
          <div className="invalid-feedback">{errors.adhaar_card.message}</div>
        )}
        <div className="form-text">
          Upload Aadhaar card image (max 2MB, JPG/PNG only)
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="voter_card" className="form-label">
          Voter Card
        </label>
        <input
          id="voter_card"
          type="file"
          className={`form-control ${errors.voter_card ? 'is-invalid' : ''}`}
          {...register('voter_card', {
            validate: {
              fileSize: (value) => {
                if (value && value[0]) {
                  return (
                    value[0].size <= 2 * 1024 * 1024 ||
                    'File size must be less than 2MB'
                  );
                }
                return true;
              },
              fileType: (value) => {
                if (value && value[0]) {
                  return (
                    ['image/jpeg', 'image/png', 'image/jpg'].includes(
                      value[0].type
                    ) || 'Only JPG, JPEG & PNG files are allowed'
                  );
                }
                return true;
              },
            },
          })}
          accept="image/jpeg,image/png,image/jpg"
        />
        {errors.voter_card && (
          <div className="invalid-feedback">{errors.voter_card.message}</div>
        )}
        <div className="form-text">
          Upload voter card image (max 2MB, JPG/PNG only)
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="pan_card" className="form-label">
          PAN Card
        </label>
        <input
          id="pan_card"
          type="file"
          className={`form-control ${errors.pan_card ? 'is-invalid' : ''}`}
          {...register('pan_card', {
            validate: {
              fileSize: (value) => {
                if (value && value[0]) {
                  return (
                    value[0].size <= 2 * 1024 * 1024 ||
                    'File size must be less than 2MB'
                  );
                }
                return true;
              },
              fileType: (value) => {
                if (value && value[0]) {
                  return (
                    ['image/jpeg', 'image/png', 'image/jpg'].includes(
                      value[0].type
                    ) || 'Only JPG, JPEG & PNG files are allowed'
                  );
                }
                return true;
              },
            },
          })}
          accept="image/jpeg,image/png,image/jpg"
        />
        {errors.pan_card && (
          <div className="invalid-feedback">{errors.pan_card.message}</div>
        )}
        <div className="form-text">
          Upload PAN card image (max 2MB, JPG/PNG only)
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="bank_check" className="form-label">
          Bank Check
        </label>
        <input
          id="bank_check"
          type="file"
          className={`form-control ${errors.bank_check ? 'is-invalid' : ''}`}
          {...register('bank_check')}
          accept="image/*,.pdf"
        />
        {errors.bank_check && (
          <div className="invalid-feedback">{errors.bank_check.message}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="reference_customer_id" className="form-label">
          Reference Customer
        </label>
        <div className="position-relative">
          <input
            type="text"
            className={`form-control ${
              errors.reference_customer_id ? 'is-invalid' : ''
            }`}
            placeholder="Search for a reference customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && (
            <div
              className="position-absolute w-100 bg-white border rounded-bottom shadow-sm"
              style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
            >
              {loading ? (
                <div className="p-2 text-center">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-2 text-center">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 cursor-pointer hover-bg-light"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSearchTerm(`${user.name} (${user.email})`);
                      setShowDropdown(false);
                      // Set the value in the form
                      const event = {
                        target: {
                          name: 'reference_customer_id',
                          value: user.id,
                        },
                      };
                      register('reference_customer_id').onChange(event);
                    }}
                  >
                    {user.name} ({user.email})
                  </div>
                ))
              )}
            </div>
          )}
          <input type="hidden" {...register('reference_customer_id')} />
        </div>
        {errors.reference_customer_id && (
          <div className="invalid-feedback">
            {errors.reference_customer_id.message}
          </div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <div className="input-group">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <i className="bi bi-eye-slash"></i>
            ) : (
              <i className="bi bi-eye"></i>
            )}
          </button>
        </div>
        {errors.password && (
          <div className="invalid-feedback">{errors.password.message}</div>
        )}
        <div className="form-text">Must be at least 6 characters</div>
      </div>

      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">
          Confirm Password
        </label>
        <div className="input-group">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className={`form-control ${
              errors.confirmPassword ? 'is-invalid' : ''
            }`}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === watch('password') || 'Passwords do not match',
            })}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            tabIndex={-1}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <i className="bi bi-eye-slash"></i>
            ) : (
              <i className="bi bi-eye"></i>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <div className="invalid-feedback">
            {errors.confirmPassword.message}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-100 py-2"
      >
        {isSubmitting ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
};

export default Register;
// This code is a React component for a registration page. It uses react-hook-form for form handling and validation, and react-toastify for notifications. The component checks if the user is already authenticated and redirects them to the dashboard if they are. It also provides feedback on form submission status and handles errors gracefully.
