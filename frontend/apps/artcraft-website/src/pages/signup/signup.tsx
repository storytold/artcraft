import { Link, useNavigate } from "react-router-dom";
import { SignupForm } from "../../components/auth";
import Seo from "../../components/seo";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots flex flex-col">
      <Seo
        title="Sign Up - ArtCraft"
        description="Create your ArtCraft account."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-30" />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C20] border border-white/10 rounded-2xl p-6 py-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create an Account</h1>
            <p className="text-white/60 text-sm">Join thousands of creators</p>
          </div>

          <SignupForm
            onSuccess={() => navigate("/welcome")}
            signupSource="artcraft"
          />

          <div className="mt-8 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary-400 font-semibold transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>

      <div className="relative z-10 py-6 text-center text-white/20 text-xs">
        &copy; {new Date().getFullYear()} ArtCraft. All rights reserved.
      </div>
    </div>
  );
};

export default Signup;
