import { jsxFactory } from "esri/widgets/support/widget";

export default (boilerplateResult) => {
    console.log(boilerplateResult);
    return {
        render() {
            return (
                <div class="center-style">
                    <h3>Custom Application</h3>
                    <h5>(check console for boilerplate results)</h5>
                </div>
            );
        }
    };
}
