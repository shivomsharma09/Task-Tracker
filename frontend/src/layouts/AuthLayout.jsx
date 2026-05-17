import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TubesBackground } from '../components/ui/TubesBackground';
import { TextPressure } from '../components/ui/TextPressure';

const AuthLayout = () => {
  const { userInfo } = useSelector((state) => state.auth);

  if (userInfo) {
    return <Navigate to="/" replace />;
  }

  return (
    <TubesBackground>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden pointer-events-none dark">
        
        {/* Text Pressure Background Layer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 -translate-y-32">
          <TextPressure 
            text="ETHARA AI" 
            className="text-[12vw] leading-none text-white/30 uppercase text-center"
            maxDistance={350}
          />
        </div>

        {/* Decorative background elements for Glassmorphism */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] pointer-events-none z-0" />
        
        {/* Foreground Content Card */}
        <div className="w-full max-w-md z-10 relative pointer-events-auto mx-4">
          <Outlet />
        </div>
      </div>
    </TubesBackground>
  );
};

export default AuthLayout;
