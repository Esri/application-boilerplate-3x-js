/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import {subclass, declared, property} from "esri/core/accessorSupport/decorators";
import * as Widget from "esri/widgets/Widget";
import * as when from "dojo/when";
import { renderable, jsxFactory } from "esri/widgets/support/widget";
import { IBoilerplateResult } from '../../boilerplate/boilerFactory';

import CustomApplication from './CustomApplication';

interface State {
    boilerplateResult: IBoilerplateResult;
    loadStatus: string;
    loadMessage: string;
}

@subclass("esri.widgets.Main")
export default class Main extends declared(Widget) {
    @property()
    @renderable()
    public state: State;

    private boilerplate: dojo.Deferred<IBoilerplateResult>;

    constructor(boilerplate) {
        super();

        this.state = {
            boilerplateResult: null,
            loadMessage: "Initializing the boilerplate..",
            loadStatus: "loading"
        };

        this.handleBoilerplateLoad = this.handleBoilerplateLoad.bind(this);
        this.handleBoilerplateError = this.handleBoilerplateError.bind(this);
        this.handleBoilerplateProgress = this.handleBoilerplateProgress.bind(this);
        this.boilerplate = boilerplate;
        this.boilerplate.then(
            this.handleBoilerplateLoad,
            this.handleBoilerplateError,
            this.handleBoilerplateProgress
        );
    }

    public render() {
        if (this.state.loadStatus === "loaded") {
            return (
                <div id="myDiv">
                    {CustomApplication(this.state.boilerplateResult).render()}
                </div>
            );
        } else if (this.state.loadStatus === "failed") {
            return (
                <h3 class="center-style">Failed to load the boilerplate.</h3>
            );
        }
        return (
            <div class="grid-container leader-1">
                <div class="loader is-active padding-leader-3 padding-trailer-3 center-style" key={"loader"}>
                    <div class="loader-bars"></div>
                    <div bind={this} class="loader-text">{this.state.loadMessage}</div>
                </div>
            </div>
        );
    }

    private handleBoilerplateLoad(boilerplateResult) {
        this.state = {
            ...this.state,
            boilerplateResult,
            loadStatus: "loaded"
        };
    }

    private handleBoilerplateError(err) {
        this.state = {
            ...this.state,
            loadStatus: "failed"
        };
    }

    private handleBoilerplateProgress(progress) {
        this.state = {
            ...this.state,
            loadMessage: progress.status
        };
    }
}
