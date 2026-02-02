"use client";

import { homePageAction } from "./actions";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

function getActionScript(actionId: string) {
	return `fetch('/foo', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=UTF-8',
    'Next-Action': '${actionId}'
  }
}).then(r => {  
  console.log('Response status:', r.status);
  return r.json();
}).then(data => {
  console.log('Response:', data);
}).catch(err => {
  console.error('Error:', err);
});`;
}

export default function Page({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const [locale, setLocale] = useState<string>("");
	const [actionId, setActionId] = useState<string>("");
	const [isCalling, setIsCalling] = useState(false);

	useEffect(() => {
		params.then((p) => setLocale(p.locale));
	}, [params]);

	const handleCallAction = async () => {
		setIsCalling(true);
		try {
			const id = await homePageAction();
			setActionId(id);
		} catch (error) {
			console.error("Failed to call action:", error);
		} finally {
			setIsCalling(false);
		}
	};

	const testCode = actionId
		? getActionScript(actionId)
		: "// Click 'Call Home Page Action' button above to get the action ID...";

	return (
		<div className={styles.pageContainer}>
			<div className={styles.pageHeader}>
				<h1>Home Page - i18n Server Action Bug Demo</h1>
				<p>
					<strong>Current Locale:</strong> {locale}
				</p>
				<p>
					<strong>Current Route:</strong>{" "}
					{locale === "en-US" ? "/" : `/${locale}`}
				</p>
			</div>

			<div className={`${styles.sectionBox} ${styles.sectionAction}`}>
				<h3>Legitimate Action (on this page):</h3>
				<div className={styles.actionControls}>
					<button
						type="button"
						onClick={handleCallAction}
						disabled={isCalling}
						className={`${styles.button} ${styles.buttonPrimary}`}
					>
						{isCalling ? "Calling..." : "Call Home Page Action"}
					</button>

					{actionId && (
						<div className={styles.actionResult}>
							<strong>✓ Action ID Captured:</strong> <code>{actionId}</code>
						</div>
					)}
				</div>
			</div>

			<div className={`${styles.sectionBox} ${styles.sectionLoop}`}>
				<h3>Infinite Rewrite Loop</h3>
				<p>
					Calling the action from a non-existent route causes infinite rewrites
					because Next.js can't associate the action with that route:
				</p>
				<ol>
					<li>
						<code>POST /foo</code> → middleware rewrites to{" "}
						<code>/en-US/foo</code>
					</li>
					<li>
						Next.js doesn't associate the action with <code>/en-US/foo</code>,
						falls back to pathname template: <code>/[locale]</code>
					</li>
					<li>
						Middleware sees <code>/[locale]</code> (no prefix), rewrites to{" "}
						<code>/en-US/[locale]</code>
					</li>
					<li>
						Next.js still can't match route, returns <code>/[locale]</code>{" "}
						again
					</li>
					<li>Loop continues → dev server crashes</li>
				</ol>
				<p className={styles.note}>
					<strong>Theory:</strong> Next.js uses the pathname template without
					filling in dynamic segments when it can't associate an action with a
					route.
				</p>
				<p className={styles.note}>
					<strong>Note:</strong> This will crash your dev server. Just restart
					with <code>npm run dev</code>.
				</p>
				<div className={styles.buttonControls}>
					<button
						type="button"
						onClick={() => {
							navigator.clipboard.writeText(testCode);
							alert(
								"Code copied! Paste in console to trigger the infinite loop.",
							);
						}}
						disabled={!actionId}
						className={`${styles.button} ${styles.buttonSmall} ${actionId ? styles.buttonDanger : styles.buttonSecondary}`}
					>
						📋 Copy Crash Code
					</button>
					<span>
						{actionId
							? "Paste in DevTools Console (F12)"
							: "Call the action first to get the ID"}
					</span>
				</div>
				<pre className={styles.codeBlock}>{testCode}</pre>
			</div>

			<div className={`${styles.sectionBox} ${styles.sectionLogs}`}>
				<h3>What You'll See in Server Logs:</h3>
				<ul>
					<li>
						Multiple "Middleware rewrite" logs showing the loop:
						<pre className={styles.codeBlockSmall}>
							{`Middleware rewrite: /foo → /en-US/foo (POST)
Middleware rewrite: /[locale] → /en-US/[locale] (POST)
Middleware rewrite: /[locale] → /en-US/[locale] (POST)
...`}
						</pre>
					</li>
					<li>
						<strong>Dev server:</strong> Will hang and stop responding
					</li>
					<li>
						<strong>Browser:</strong> Request will timeout
					</li>
				</ul>
			</div>

			<div className={styles.navSection}>
				<h3>Navigation:</h3>
				<ul>
					<li>
						<a href="/">Home (en-US)</a>
					</li>
					<li>
						<a href="/en-GB">Home (en-GB)</a>
					</li>
				</ul>
			</div>
		</div>
	);
}
