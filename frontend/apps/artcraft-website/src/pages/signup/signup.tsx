import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  checkoutIntentFromSearchParams,
  redirectToCheckout,
} from "@storyteller/ui-pricing-table";
import { SignupForm } from "../../components/auth";
import Seo from "../../components/seo";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutIntent = checkoutIntentFromSearchParams(searchParams);

  const handleSuccess = async () => {
    // A pricing-page purchase click brought the user here; resume Stripe
    // checkout for the plan they picked instead of the welcome flow.
    if (checkoutIntent && (await redirectToCheckout(checkoutIntent))) {
      return;
    }
    navigate("/welcome");
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden flex flex-col">
      <Seo
        title="Sign Up - ArtCraft"
        description="Create your ArtCraft account."
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C20] border border-white/10 rounded-2xl p-6 py-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Create an Account</h1>
            <p className="text-white/60 text-sm">Join thousands of creators</p>
          </div>

          <SignupForm
            onSuccess={handleSuccess}
            signupSource="artcraft"
          />

          <div className="mt-8 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link
              to={{ pathname: "/login", search: searchParams.toString() }}
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
