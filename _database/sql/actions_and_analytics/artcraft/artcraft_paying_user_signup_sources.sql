select
    u.created_at,
    CASE
        WHEN u.maybe_landing_url LIKE '%?r=%' THEN 'user_referral'
        WHEN u.maybe_landing_url LIKE '%gad_source%' THEN 'google_ads'
        WHEN u.maybe_landing_url LIKE '%utm_source=fakeyou%' THEN 'fakeyou'
        WHEN u.maybe_landing_url LIKE '%utm_source=storyteller%' THEN 'storyteller'
        WHEN u.maybe_landing_url LIKE '%utm_source=artcraftai%' THEN 'artcraft_dot_ai_domain'
        WHEN u.maybe_referral_url LIKE '%instagram%' THEN 'instagram'
        WHEN u.maybe_referral_url LIKE '%reddit%' THEN 'reddit'
        WHEN u.maybe_referral_url LIKE '%google%' THEN 'google'
        WHEN u.maybe_referral_url LIKE '%brave%' THEN 'brave'
        WHEN u.maybe_referral_url LIKE '%duckduckgo%' THEN 'duckduckgo'
        WHEN u.maybe_referral_url LIKE '%yahoo.com%' THEN 'yahoo'
        WHEN u.maybe_referral_url LIKE '%yandex%' THEN 'yandex'
        WHEN u.maybe_referral_url LIKE '%bing.com%' THEN 'bing'
        WHEN u.maybe_referral_url LIKE '%github.com%' THEN 'github'
        WHEN u.maybe_referral_url LIKE '%chatgpt%' THEN 'chatgpt'
        WHEN u.maybe_referral_url LIKE '%https://t.co%' THEN 'twitter'
        WHEN u.maybe_referral_url LIKE '%x.com%' THEN 'twitter'
        WHEN u.maybe_referral_url LIKE '%youtube%' THEN 'youtube'
        WHEN u.maybe_referral_url LIKE '%fakeyou.com%' THEN 'fakeyou'
        WHEN u.maybe_referral_url LIKE '%ycombinator%' THEN 'hackernews'
        WHEN u.maybe_referral_url LIKE '%seedanceprice%' THEN 'seedanceprice_reddit'
        WHEN u.maybe_landing_url LIKE '%utm_source=ig%' THEN 'instagram'
        WHEN u.maybe_landing_url LIKE '%utm_source=chatgpt%' THEN 'chatgpt'
        WHEN u.maybe_landing_url LIKE '%/media/%' THEN 'reddit'
        ELSE 'unknown'
        END AS user_source,
    u.maybe_referral_url,
    u.maybe_landing_url,
    u.username,
    us.maybe_stripe_customer_id as subscription_customer,
    l.stripe_customer_id as credits_customer,
    u.email_address,
    CASE
        WHEN u.maybe_source LIKE '%artcraft_get_web%' THEN 'website'
        WHEN u.maybe_source LIKE '%artcraft%' THEN 'app_or_website'
        WHEN u.maybe_source LIKE '%artcraft_get_s%' THEN 'website_stripe_checkout'
        ELSE u.maybe_source
        END AS maybe_source,
    u.maybe_signup_method,
    u.created_at,
    u.updated_at
from users u
    left outer join user_subscriptions us
         on us.user_token = u.token
         and us.subscription_namespace  = 'artcraft'
    left outer join user_stripe_customer_links l
         on l.user_token = u.token
         and l.payments_namespace = 'artcraft'
where (us.maybe_stripe_customer_id  IS NOT NULL OR l.stripe_customer_id IS NOT NULL)
order by u.created_at desc;