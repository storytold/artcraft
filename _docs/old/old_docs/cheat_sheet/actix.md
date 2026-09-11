development notes
=================

Actix notes
-----------

json request
```
async fn handler(request: web::Json<Mytype>) -> impl Responder { "whatever" }
```

form-multipart request
```
async fn handler(request: web::Form<Mytype>) -> impl Responder { "whatever" }
```

route parameters
```
#[get("/{name}")]
async fn hello(name: web::Path<String>) -> impl Responder { format!("Hi {}", name) }
```
