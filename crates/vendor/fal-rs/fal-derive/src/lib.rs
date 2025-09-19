use proc_macro::TokenStream;
use quote::quote;
use syn::{
    parse::Parse, parse::ParseStream, parse_macro_input, punctuated::Punctuated, FnArg, ItemFn,
    Meta, PatType, ReturnType, Token,
};

enum EndpointAttr {
    Path(String),
    InFalCrate,
}

impl Parse for EndpointAttr {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let meta: Meta = input.parse()?;
        match meta {
            Meta::Path(path) if path.is_ident("in_fal_crate") => Ok(EndpointAttr::InFalCrate),
            Meta::NameValue(nv) if nv.path.is_ident("endpoint") => match nv.value {
                syn::Expr::Lit(lit) => {
                    if let syn::Lit::Str(s) = lit.lit {
                        return Ok(EndpointAttr::Path(s.value()));
                    }
                    Err(syn::Error::new_spanned(lit, "expected string literal"))
                }
                _ => Err(syn::Error::new_spanned(nv.value, "expected string literal")),
            },
            _ => Err(syn::Error::new_spanned(
                meta,
                "expected endpoint = \"...\" or in_fal_crate",
            )),
        }
    }
}

#[doc = include_str!("../README.md")]
#[proc_macro_attribute]
pub fn endpoint(attr: TokenStream, item: TokenStream) -> TokenStream {
    let attr =
        parse_macro_input!(attr with Punctuated::<EndpointAttr, Token![,]>::parse_terminated);
    let input_fn = parse_macro_input!(item as ItemFn);

    // Extract the endpoint string and in_fal_crate flag from the attributes
    let mut endpoint_str = None;
    let mut in_fal_crate = false;

    for attr in attr.iter() {
        match attr {
            EndpointAttr::Path(s) => endpoint_str = Some(s),
            EndpointAttr::InFalCrate => in_fal_crate = true,
        }
    }

    let endpoint_str = endpoint_str.expect("endpoint attribute must be provided");

    let fn_name = &input_fn.sig.ident;
    let fn_name_str = fn_name.to_string();
    let camel_case_name = snake_to_upper_camel(&fn_name_str);
    let struct_name = syn::Ident::new(&format!("{}Params", camel_case_name), fn_name.span());
    let vis = &input_fn.vis;

    // Extract function parameters
    let mut param_fields = Vec::new();
    let mut param_names = Vec::new();

    for arg in input_fn.sig.inputs.iter() {
        if let FnArg::Typed(PatType { pat, ty, .. }) = arg {
            if let syn::Pat::Ident(pat_ident) = *pat.clone() {
                let ident = pat_ident.ident.clone();
                param_fields.push(quote! { pub #ident: #ty });
                param_names.push(pat_ident.ident);
            }
        }
    }

    // Extract return type
    let return_type = match &input_fn.sig.output {
        ReturnType::Type(_, ty) => ty,
        _ => panic!("Function must have a return type"),
    };

    // Choose the appropriate crate reference
    let crate_ref = if in_fal_crate {
        quote! { crate }
    } else {
        quote! { fal }
    };

    // Generate the expanded code
    let struct_def = quote! {
        #[derive(serde::Serialize)]
        #vis struct #struct_name {
            #(#param_fields),*
        }
    };

    let inputs = input_fn.sig.inputs;

    let fn_def = quote! {
        #vis fn #fn_name(#inputs) -> #crate_ref::request::FalRequest<#struct_name, #return_type> {
            #crate_ref::request::FalRequest::new(
                #endpoint_str,
                #struct_name {
                    #(#param_names: #param_names),*
                }
            )
        }
    };

    let expanded = quote! {
        #struct_def
        #fn_def
    };

    TokenStream::from(expanded)
}

fn snake_to_upper_camel(input: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = true;

    for c in input.chars() {
        if c == '_' {
            capitalize_next = true;
        } else if capitalize_next {
            result.push(c.to_ascii_uppercase());
            capitalize_next = false;
        } else {
            result.push(c);
        }
    }

    result
}
