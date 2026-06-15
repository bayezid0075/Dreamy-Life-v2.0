'use client';

import { useState, useEffect } from 'react';

interface SettingsSection {
  title: string;
  description: string;
  icon: string;
  items: Array<{
    label: string;
    description: string;
    type: 'text' | 'toggle' | 'select';
    value: string;
    options?: string[];
  }>;
}

const defaultSections: SettingsSection[] = [
  {
    title: 'General',
    description: 'Platform name and basic configuration',
    icon: 'settings',
    items: [
      { label: 'Platform Name', description: 'Display name shown across the app', type: 'text', value: 'Dreamy Life' },
      { label: 'Maintenance Mode', description: 'Temporarily disable public access', type: 'toggle', value: 'off' },
      { label: 'Default Language', description: 'Primary language for new users', type: 'select', value: 'en', options: ['en', 'bn', 'hi'] },
    ],
  },
  {
    title: 'Referral System',
    description: 'Configure referral rewards and commission rates',
    icon: 'share',
    items: [
      { label: 'Level 1 Commission', description: 'Percentage earned from direct referrals', type: 'text', value: '10' },
      { label: 'Level 2 Commission', description: 'Percentage earned from second-level referrals', type: 'text', value: '5' },
      { label: 'Level 3 Commission', description: 'Percentage earned from third-level referrals', type: 'text', value: '2' },
      { label: 'Minimum Withdrawal', description: 'Minimum balance required to withdraw (৳)', type: 'text', value: '100' },
    ],
  },
  {
    title: 'Notifications',
    description: 'Manage email and push notification settings',
    icon: 'notifications',
    items: [
      { label: 'Email Notifications', description: 'Send transactional emails to users', type: 'toggle', value: 'on' },
      { label: 'Push Notifications', description: 'Send mobile push notifications', type: 'toggle', value: 'on' },
      { label: 'Admin Alerts', description: 'Receive alerts for new registrations and purchases', type: 'toggle', value: 'on' },
    ],
  },
];

export default function SettingsPage() {
  const [sections, setSections] = useState(defaultSections);
  const [saved, setSaved] = useState(false);

  const handleToggle = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) =>
      prev.map((section, si) =>
        si === sectionIdx
          ? {
              ...section,
              items: section.items.map((item, ii) =>
                ii === itemIdx ? { ...item, value: item.value === 'on' ? 'off' : 'on' } : item
              ),
            }
          : section
      )
    );
  };

  const handleTextChange = (sectionIdx: number, itemIdx: number, value: string) => {
    setSections((prev) =>
      prev.map((section, si) =>
        si === sectionIdx
          ? {
              ...section,
              items: section.items.map((item, ii) => (ii === itemIdx ? { ...item, value } : item)),
            }
          : section
      )
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Settings</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">Configure platform preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl primary-gradient text-on-primary font-label-md text-label-md font-bold flex items-center gap-sm"
        >
          {saved ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check</span>
              Saved
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {sections.map((section, si) => (
          <div key={section.title} className="glass-panel rounded-xl p-md space-y-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">{section.icon}</span>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">{section.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{section.description}</p>
              </div>
            </div>

            <div className="space-y-sm">
              {section.items.map((item, ii) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-outline-variant/30 last:border-0">
                  <div className="flex-1 mr-md">
                    <p className="font-body-md text-body-md text-on-surface font-bold">{item.label}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>
                  </div>
                  {item.type === 'toggle' && (
                    <button
                      onClick={() => handleToggle(si, ii)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        item.value === 'on' ? 'bg-primary' : 'bg-outline-variant'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          item.value === 'on' ? 'left-[26px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  )}
                  {item.type === 'text' && (
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleTextChange(si, ii, e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg input-glass font-body-sm text-body-sm text-on-surface text-right focus:outline-none"
                    />
                  )}
                  {item.type === 'select' && (
                    <select
                      value={item.value}
                      onChange={(e) => handleTextChange(si, ii, e.target.value)}
                      className="px-3 py-2 rounded-lg input-glass font-body-sm text-body-sm text-on-surface focus:outline-none"
                    >
                      {item.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
