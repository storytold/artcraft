import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  checkoutIntentFromSearchParams,
  redirectToCheckout,
} from "@storyteller/ui-pricing-table";
import { AuthHeader, AuthFooter, SignupForm } from "../../components/auth";
import Seo from "../../components/seo";
import { Reveal } from "../../components/motion/reveal";

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
    <>
      <Seo
        title="Sign Up - ArtCraft"
        description="Create your ArtCraft account."
      />
      <AuthHeader title="Create an Account" subtitle="Join thousands of creators" />

      {/* SignupForm runs its own field cascade internally (see signup-form.tsx).
          The footer picks up the tail of that cascade — the form's six staggered
          steps land by ~0.36s, so the footer follows at ~0.44s. */}
      <SignupForm
        onSuccess={handleSuccess}
        signupSource="artcraft"
      />

      <Reveal inView={false} delay={0.44}>
        <AuthFooter>
          Already have an account?{" "}
          <Link
            to={{ pathname: "/login", search: searchParams.toString() }}
            className="font-semibold text-primary transition-colors hover:text-primary-400"
          >
            Log in
          </Link>
        </AuthFooter>
      </Reveal>
    </>
  );
};

export default Signup;
