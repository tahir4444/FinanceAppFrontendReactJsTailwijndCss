import Register from '../components/auth/Register.jsx';
import '../index.css';

const RegisterPage = () => {
  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg">
              {/* Header Section */}
              <div className="card-header bg-primary text-white text-center py-4">
                <h2 className="mb-0">Create Account</h2>
                <p className="text-white-50 mb-0 mt-2">Join us today</p>
              </div>

              {/* Register Form Container */}
              <div className="card-body p-4">
                <Register />

                {/* Additional Links */}
                <div className="text-center mt-4">
                  <a
                    href="/login"
                    className="text-decoration-none text-primary"
                  >
                    Already have an account? Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
