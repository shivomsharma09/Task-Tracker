import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TubesBackground } from '../components/ui/TubesBackground';

const AuthLayout = () => {
  const { userInfo } = useSelector((state) => state.auth);

  if (userInfo) {
    return <Navigate to="/" replace />;
  }

  return (
    <TubesBackground>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden pointer-events-none">
        {/* Decorative background elements for Glassmorphism */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md z-10 relative pointer-events-auto">
          <Outlet />
        </div>
      </div>
    </TubesBackground>
  );
};

export default AuthLayout;
