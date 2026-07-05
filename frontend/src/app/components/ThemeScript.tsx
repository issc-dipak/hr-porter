"use client";

import { useServerInsertedHTML } from 'next/navigation';

export default function ThemeScript() {
  useServerInsertedHTML(() => {
    return (
      <script
        id="hr-theme-init"
        dangerouslySetInnerHTML={{
          __html: `
            (() => {
              try {
                const storedTheme = localStorage.getItem('hr_system_theme_mode');
                let shouldUseDark = true;
                if (storedTheme === 'Light') {
                  shouldUseDark = false;
                } else if (storedTheme === 'System') {
                  shouldUseDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                } else {
                  const storedDark = localStorage.getItem('hr_system_dark_mode');
                  shouldUseDark = storedDark === null ? true : storedDark === 'true';
                }
                document.documentElement.classList.toggle('dark', shouldUseDark);
              } catch (_) {
                document.documentElement.classList.add('dark');
              }
            })();
          `
        }}
      />
    );
  });

  return null;
}
