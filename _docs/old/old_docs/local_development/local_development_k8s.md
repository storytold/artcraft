# Local Kubernetes environment for standing up the APIs and their dependencies

(These are Paul's notes.)

- Install minikube, kubectl, docker, and musl from your OS package manager
- `rustup target add x86_64-unknown-linux-musl`
- `cargo build --release --bin storyteller-web --target=x86_64-unknown-linux-musl`
- `minikube start --extra-config=apiserver.service-node-port-range=1-65535`
- `eval $(minikube docker-env)`
- `minikube mount /path/to/storyteller-rust/:/storyteller-rust &> /dev/null &`
- `docker build -t storyteller-web -f localdev/Dockerfile .`
- `kubectl apply -f localdev/kubernetes.yml`
- Get the ip address of minikube with `minikube ip`, this is where all the services will be running on their 
regular ports (12345 for the api, 6379 for redis, 3306 for mysql)
- That's it, we just spun up mysql, applied database migrations, spun up redis, and spun up our api

# Development tips
- Rebuild and "deploy" (locally) with `cargo build --release --bin storyteller-web --target=x86_64-unknown-linux-musl && kubectl rollout restart storyteller-web`
- View logs from the api with `kubectl logs  storyteller-web<TAB>`
- Delete everything minikube (if you start running out of disk space or what-have-you) with `minikube delete`
- See pod status with `kubectl get pods`
- If there are errors you can get more info with `kubectl describe pods`
