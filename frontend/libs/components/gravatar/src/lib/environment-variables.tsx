class EnvironmentVariables {
  values: Record<string, string | boolean> = {};

  initialize(values: Record<string, string | boolean>) {
    this.values = values;
  }
}

const environmentVariables = new EnvironmentVariables();
export default environmentVariables;
