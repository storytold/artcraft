interface DefaultAvatar {
    color_index: number;
    image_index: number;
}
interface User {
    default_avatar: DefaultAvatar;
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
}
export interface BetaKey {
    created_at: string;
    creator: User;
    is_distributed: boolean;
    key_value: string;
    maybe_note?: string;
    maybe_note_html?: string;
    maybe_redeemed_at?: string;
    maybe_redeemer?: User;
    maybe_referrer?: User;
    product: string;
    token: string;
}
export {};
//# sourceMappingURL=BetaKeys.d.ts.map