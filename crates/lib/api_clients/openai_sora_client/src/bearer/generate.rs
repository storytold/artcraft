use errors::AnyhowResult;
use log::error;
use reqwest::Client;
use serde_derive::Deserialize;

const SORA_BEARER_GENERATE_URL: &str = "https://sora.com/api/auth/session";

#[derive(Debug, Deserialize)]
pub struct SoraAuthResponse {
    pub user: SoraUser,
    pub expires: String,
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "internalApiBase")]
    pub internal_api_base: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SoraUser {
    pub id: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub image: Option<String>,
    pub picture: Option<String>,
    pub provider: Option<String>,
    #[serde(rename = "lastAuthorizationCheck")]
    pub last_authorization_check: Option<i64>,
}

pub async fn generate_bearer_with_cookie(cookie: &str) -> AnyhowResult<String> {
    let client = Client::builder()
        .gzip(true)
        .build()?;

    let response = client.get(SORA_BEARER_GENERATE_URL)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
        .header("Accept", "*/*")
        .header("Accept-Encoding", "gzip, deflate, br")
        .header("Accept-Language", "en-US,en;q=0.5")
        .header("Cookie", cookie)
        .send()
        .await?;

    if !response.status().is_success() {
        error!("Failed to generate bearer token: {}", response.status());
        return Err(anyhow::anyhow!("Failed to generate bearer token: {}", response.status()));
    }
    let response_body = &response.text().await?;
    println!("response_body: {}", response_body);

    let auth_response: SoraAuthResponse = serde_json::from_str(&response_body)?;
    Ok(auth_response.access_token)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires valid cookie
    async fn test_generate_bearer_with_cookie() {
        let cookie = "cf_clearance=nelyAZB.T1J.3ToyOuc_NozgPVqEmOoZXZgVqICRVLQ-1745296855-1.2.1.1-R..9Ca0ZCZjSoqDaWLD62phe1hUu.43nPpJV2zqxDibkFPCLJ2R2Am6ygUqJTB1_b86ctFGktBZ4YIPrHHow3jqPk5Mfu_VubL2A5r0R6R_1ILrdvY168CLSpAFRsJKIupMUPBFDePmQ738P7afr8W0YK6dO_m0qjYDYquZyCu5dC3u9CRUGaM8SLDZTTZkxoLzuxDzB1Skuns5rqdjTft4DoNUI_7EJvsYxKoklWylvL2FqcETULoyVq5FyElbZenz8VblXU4HLgspRTz3q0_SNh4_LAIxHygfXaCOBmmii1KY6mFHE83z4JYWgx7MM9jqxKKz1pHgVd8JR72aYgTo7WwE6ZpKmvuxhTtgobsA; oai-did=8ae351f6-bc99-45c9-9fff-bb8dd6eb128b; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiYWNBYVdTWHBfaDZnNkxtUEs1S0RvTjR3NHFxTEsxVlpSTHA4VWdiaFdWNjctMG5pbDdVVjBCN2dSUU9Bem84ZXBjMVFjb1ozNGxwa0c1OEUyU2Q4cUEifQ..n6nMP5MA40XKktVazIps6w.tsgjkdkBaHt2jpO7GjIBzgammeanUH5W-3SQMPUDIG_cMrGcgmW_uaMwQY-LJ7qfWGfSqwZyGND6LQD_e-8vYdWbhE_gl1O8AQVJaLfCxJbpauCaXQTsSD0PD_XzGYsW0GZjWIbb-J8YFc-XKi8Y2AhjPhf2El5LJrvkQ4MbtlIJAhDOBNAp7UiBR4SWvWgtD60WqqnW3BhUjqXSigqhopUIkcsXAx_NHkfQpwFyJfkI8WK7JJoW4SbD6hdOX0BCKPjXKn7bTpYG---QkfjJ5f5wsRl0QYRVIQ4lzz4iak0A7oyV5jyX_aXYzK4iroVtEjUBAt77wTDOZ8ID3idkPOWQHPWnaugDzX9ZxZ8sWOxsttqbIMWWpEIm9G9ODc3-F29XHPLzciiLuRlRp2tn2ky12vXBdpiFINL7i5-OEryQ1xs1yEsSnAkzrGcXboXDgPSh-wPpmOhWLwqsydmflSahxQH-k0fUQAnjCq2EocdXnfIL84kqwnOxD36YGsKcX0DOir_3gL2PnAcE25Dql1OTwo9SBSLEf2c8dejDVfFT63UHmCkEqvHgdtTnZRApeqJj57A_2aFvy4d8mhflSaSD5qYmYUIdRo5I-uJumWOuHeDOwXOrlnCzxpgvcl1c5ng560I_oYgNUAhIGUnL5ezMQ3MD6jKwVqk-0kKZUPr2ebE1_w7jh4Rau6esLYiMcJI-Jfm_0TfSxlAXMKC3CKIII50PcXXOrvxy0yiBU_DwU79L6fYPAq7NFJ26P6821iOQGP-0mkaHPZHxEJGaPVKKjg2Y9ZQJ9u1gnm0GWwssY4uhFet6CxURnpqzIXKf78kevXOwkEsgFa-2hhMnr_OWBzKSH4UfVIymulxqoAoOh7Em51NUF-HJ0I0rr_3m7wBlhNvVVnmaxSYkuArZoboixX9ka-JVDopTPXUvoEykm45LRRvPdGiPB5hvCrglzNrp_vep4n-YbcLp4Uzn9ljcMjhSFZfXAzqquaiO7H5ys50_-mBquTq0Hoag2pHbVr5uJL8I1V-b8F1XWOnRtRIlj5pHoLX6KyxlT7pNTTSRgMo9PwAWxmLXpRba1h4ceKQTDputfrD1-itFJfZ3FZgkAXVQGrYyXEQIj79ERqq9xw18qGoBi9-GQkqBmCg1TxeS35SBnc62L7gh-UsZ_LSchizC4l4KODSeKdyNGHRONzK0cNHAGWqAJpLu5vBh_VxiljeaQxc4-p0SRiMXPYQf06uWDaRPdglCcavnlPKOcbL1GLku8CzMMCTAeqN3TJBV8BOHXsW81jw73oaBv18peTpgaJS6-Og9jMQVDb8pwlCi7SZnf1uafeGnBb6jJN4qCBN5EjZcoQikHxv0SOYmjs2XN7xE7EyczkovGcU2K3v03cnbbe01U_1mBAXgiJrW8gb4u3x8kngtphuWjEbStqHivLCtP5dyD22LTEMUE4ixvDmKwuLoB2NukM4QcB7PwrMnjI30SfCx0l5OVToz-TmLkLa-Ous-2cckw-D5pXD4RsgLv5NsxGQ9rtaL3qWeA8KnOByvYH1thLFtBUw6rjHtwLnQUGPomJkXIV8OuEuIWWnbsD1jW7hIpbYynhizTyrLChTnxuD8Witu01NtRa0dqSEhy3H5Y0qDXqFhaziydmW_kIdDxQBCWvPBNVBMAlXldqXgazM05eK3DFP86Div8b8k0pjXNoEtmEcwGLR06taiwQ3Fjbyc3y4HSLnQ-_yYz2jKLbDzpVJdaS6tlWT9rOrgniCkfvxJ5LE6KMF_2i6L_yFprOQ1DCYniM39CFehsD-7XVpS2Ui9t-Kx1g7eebK229kdQzB6Dm_HBEHTOxyXMiR4C0n24WYxEHukfCSiAvChiXHhfHOldmzusKY0r-MB_knKgM69elcXN_VAiukuUo1EdrsaqBprHqwmbkEWYfg-TmYefXJnf-58Xtx0lC2T7Uq8JJDdQL4f4PTnuyU_JX5NOwg9CwDUZoPE4gvYTicshEKxw4TABawLB6LXzr5vxjr1PK9lP1H7iwSyutBUGHEyK_R7fM0OzFQSfMEENwKtaGmGT5GnMTkvF4iGTyEtmZS1RhWqYyIagSFkf66ZRIwt5uohQJhZ8kpU_EOfihCkPC6c8he18W2TPtvGWxe0ljNfykMl-w4564IuHIYO3sESs9RzOdHkul9YqpjZC1C831zzEyM3vgM3hYWKo2VmovC5uMYZO0roqQyuy9RNbGPbXnbzMCE5tTPNeHMd1FVYNGy76t-BLj69MfJN0C-U9RgaLRe2Nz34EZBBfK3v9NNCLYhqm04WhM7XwX3CMrG9_j8mlMKpb_MxYqvQUodtttrBoe3bS4WId7OSz8k3KiswcZD86yopGq5X_a910-C3VzVfxo9jCLlRVP4moY2iohjc9asuQrKjqkUgEXp0bLy-gBB67UxV69rXMBEtz2pLYqfNKEUFFL7cVF1d407QUuSRpANitXUFbmtWo5M-0mJQM7LA0ktMDZUl3_-hPxNHFt9Sba4xDEiSyjPdMZDd--iNpCkJAGvManh-cNYI7HIBQM3kLE4GwD3ihStlW3IT5MfITEXfaaz0vWSvYdMXXmcVjVzgVn5JchynFilRsx7QK4JT7jPb_LQ1vAENBCfIuEERty8dgrKOvS4k21Br6IXckd9hl6l_5GoZUpbQzEY4BWGA8Ly8xKGbwwF4L-Mncc4TQt-2y09qYqU0TMTTXKBGgFfjVn4r0yIvryieCRAHSWuethGyYVX_Qhk_nZB3jqFkp42vMc1mkTjBCR-jlUCJWMbMcmL0tW2_SXDOk5JrACsq-T1djWeUCPgGYXCqYIygtSEE0f025feOpQJAynV78UM2w6fbgGBvsODpVr8Q2hjiI9Ydwh6MIJW1owo1QDDnuEOvTmdwdsQT9wX1H-SyN0cusSITAzgNMEp-NCj8NDW60kqTCbi7kMLF4OtPOK8THCBBkZ5c_SasAvSIxXo36fnMEKGPOLZs9GzLKMtKupym5PZ4H6H2zl_Y6iOIBniyQ3HBs5edLBBGQ3qqeeI_j7Xpwsr06cTCuQGYFAsNhu9dSs3LQTKlVfVeTiqBjRkxAiaQJgPUvFpOCvhIe2t-5n-MNj4.0dhenwDdC-iJ2W4uNnbx9YQcfEgnYSJzo1vXNawiifA; __Host-authjs.csrf-token=61aa1209933a1c967b7af6a787481f4e249a2d6b1d535924540addd4bd4ba196%7C510cca933fb90ce231290471f3885cdee2fdaf4f8f6994d96cfef9c63227e5f7; __Secure-authjs.callback-url=https%3A%2F%2Fsora.com; _cfuvid=XjJAS2zDerYymewq8Gl3e572OMiJ3cyyMqsmFiuGMn4-1745275079858-0.0.1.1-604800000; __cf_bm=hVGZ2X.67OhOZrqzUiW9Xg4IYGdCnss73d7GDU75YHk-1745296490-1.0.1.1-ppPUYZX7zAWYWXknUVzYPLjI7HDdBfmQz9DDMT5pMUNvqKBMhbUrJCp30PzxmBjMYwQL3injMe2IammgQNE5cj7JO7o6Alljt.MN1Pp8s8k; __cflb=0H28vtyuPgbsDEUozcoHSWoAnvpSqAh9friCA2BEchB; _dd_s=rum=2&id=b52d0910-2332-43c2-9fa0-da1c33d06227&created=1745296855240&expire=1745297781201";
        let result = generate_bearer_with_cookie(cookie).await;
        assert!(result.is_ok());
        println!("Bearer token: {}", result.unwrap());
    }
}
