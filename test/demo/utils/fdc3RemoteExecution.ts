/**
 * This module contains util functions mirroring those in the client module, but
 * with the additional feature of invoking them on a remote window.
 *
 * Most of call signatures are identical to the client API, but with an
 * additional "executionTarget" parameter as the first argument.
 *
 * The Listner classes have been replaced with functions which will create the
 * listeners and when triggered will invoke the provided callback in the test's
 * context (i.e. in node, not the window);
 */

import {Identity} from 'openfin/_v2/main';

import {Application, Context, IntentType} from '../../../src/client/main';

import {OFPuppeteerBrowser, TestWindowContext} from './ofPuppeteer';

const ofBrowser = new OFPuppeteerBrowser();

export async function open(executionTarget: Identity, name: string, context?: Context): Promise<void> {
    return ofBrowser.executeOnWindow(executionTarget, function(this: TestWindowContext, name: string, context?: Context): Promise<void> {
        return this.OpenfinFDC3.open(name, context);
    }, name, context);
}

export async function resolve(executionTarget: Identity, intent: IntentType, context?: Context): Promise<Application[]> {
    return ofBrowser.executeOnWindow(executionTarget, async function(this: TestWindowContext, intent: IntentType, context?: Context): Promise<Application[]> {
        return this.OpenfinFDC3.findIntent(intent, context).then(appIntent => appIntent.apps);
    }, intent, context);
}

export async function broadcast(executionTarget: Identity, context: Context): Promise<void> {
    return ofBrowser
        .executeOnWindow(
            executionTarget,
            async function(this: TestWindowContext, context: Context):
                Promise<void> {
                return this.OpenfinFDC3.broadcast(context);
            },
            context
        )
        .then(() => new Promise<void>(res => setTimeout(res, 100)));  // Broadcast is fire-and-forget. Slight delay to allow for service to handle
}

/**
 * This will register a simple contextListener on the window.
 *
 * Returns a promise which resolves to the context passed to the listener
 */
export async function addContextListener(executionTarget: Identity, handler: (context: Context) => void): Promise<void> {
    return ofBrowser
        .executeOnWindow(
            executionTarget,
            async function(this: TestWindowContext):
                Promise<Context> {
                return new Promise<Context>(res => {
                    const listener = this.OpenfinFDC3.addContextListener((context: Context) => {
                        res(context);
                    });
                });
            }
        )
        .then(async (result) => {
            handler(await result);
        });
}
