import { Link, useNavigate } from "react-router-dom";
import { AuthHeader, AuthFooter, SignupForm } from "../../components/auth";
import Seo from "../../components/seo";
import { Reveal } from "../../components/motion/reveal";

const Signup = () => {
  const navigate = useNavigate();

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
        onSuccess={() => navigate("/welcome")}
        signupSource="artcraft"
      />

      <Reveal inView={false} delay={0.44}>
        <AuthFooter>
          Already have an account?{" "}
          <Link
            to="/login"
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
