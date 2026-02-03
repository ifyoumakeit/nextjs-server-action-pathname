"use client";

import { homePageAction } from "./actions";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Page({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const [locale, setLocale] = useState<string>("");
	const [isCrashing, setIsCrashing] = useState(false);

	useEffect(() => {
		params.then((p) => setLocale(p.locale));
	}, [params]);

	const handleTriggerCrash = async () => {
		setIsCrashing(true);
		try {
			// Get the action ID
			const id = await homePageAction();

			// Then trigger the infinite loop by calling the action from /foo
			fetch("/foo", {
				method: "POST",
				headers: {
					"Content-Type": "text/plain;charset=UTF-8",
					"Next-Action": id,
				},
			})
				.then((r) => {
					console.log("Response status:", r.status);
					return r.json();
				})
				.then((data) => {
					console.log("Response:", data);
					setIsCrashing(false);
				})
				.catch((err) => {
					console.error("Error:", err);
					setIsCrashing(false);
				});
		} catch (error) {
			console.error("Failed to trigger crash:", error);
			setIsCrashing(false);
		}
	};

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

			<div className={`${styles.sectionBox} ${styles.sectionLoop}`}>
				<h3>Infinite Rewrite Loop</h3>
				<p>
					Calling the action from a route that is not associated with the server
					action causes infinite rewrites.
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
					<li>Loop continues until max rewrites (10) is reached</li>
				</ol>
				<p className={styles.note}>
					<strong>Theory:</strong> Next.js uses the pathname template without
					filling in dynamic segments when it can't associate an action with a
					route.
				</p>
				<p className={styles.note}>
					<strong>Note:</strong> Limited to 10 rewrites to prevent server crash.
					You'll see a 500 error instead.
				</p>
				<button
					type="button"
					onClick={handleTriggerCrash}
					disabled={isCrashing}
					className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
				>
					{isCrashing ? "Triggering..." : "💣 Trigger Infinite Loop"}
				</button>
			</div>

			<div className={`${styles.sectionBox} ${styles.sectionLogs}`}>
				<h3>What You'll See in Server Logs:</h3>
				<ul>
					<li>
						Multiple "Middleware rewrite" logs showing the loop:
						<pre className={styles.codeBlockSmall}>
							{`Middleware rewrite [1]: /foo → /en-US/foo (POST)
Middleware rewrite [2]: /[locale] → /en-US/[locale] (POST)
Middleware rewrite [3]: /[locale] → /en-US/[locale] (POST)
...
failed to forward action response [TypeError: fetch failed] {...`}
						</pre>
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
