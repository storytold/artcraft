import { ApiManager, ApiResponse } from './ApiManager.js';
import { UserInfo } from './models/Users.js';
export declare class UsersApi extends ApiManager {
    private authFetch;
    GetSession(): Promise<ApiResponse<{
        loggedIn: boolean;
        user?: UserInfo;
    }>>;
    GetUserProfile(username: string): Promise<ApiResponse<{
        user?: UserInfo;
    }>>;
    Login({ usernameOrEmail, password, }: {
        usernameOrEmail: string;
        password: string;
    }): Promise<ApiResponse<{
        signedSession?: string;
    }>>;
    Logout(): Promise<ApiResponse<null>>;
    Signup({ username, email, password, passwordConfirmation, signupSource, }: {
        username: string;
        email: string;
        password: string;
        passwordConfirmation: string;
        signupSource?: string;
    }): Promise<ApiResponse<{
        signedSession?: string;
    }>>;
}
//# sourceMappingURL=UsersApi.d.ts.map