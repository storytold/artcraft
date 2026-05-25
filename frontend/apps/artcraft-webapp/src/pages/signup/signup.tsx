import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, SignupForm } from "../../components/auth";
import Seo from "../../components/seo";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <>
      <Seo
        title="Sign Up - ArtCraft"
        description="Create your ArtCraft account."
      />
      <AuthLayout
        title="Create an Account"
        subtitle="Join thousands of creators"
        footer={
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary transition-colors hover:text-primary-400"
            >
              Log in
            </Link>
          </>
        }
      >
        <SignupForm
          onSuccess={() => navigate("/welcome")}
          signupSource="artcraft"
        />
      </AuthLayout>
    </>
  );
};

export default Signup;
