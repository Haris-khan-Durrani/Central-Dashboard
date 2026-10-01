'use client';

import React from 'react';
import { Globe } from 'lucide-react';

export interface NationalityItem {
  nationality: string;
  leads: number;
  won: number;
  conversionRate: string;
  revenue: number;
  color: string;
}

interface NationalityMatrixProps {
  nationalities: NationalityItem[];
  currency: string;
}

/**
 * Resolves nationality or country name string to ISO-3166-1 alpha-2 country code
 */
export function getCountryCode(nationality: string): string | null {
  if (!nationality) return null;
  const s = nationality.toLowerCase().trim();

  if (s.includes('unspecified') || s.includes('unknown') || s.includes('n/a') || s.includes('none') || s === '-') {
    return null;
  }

  // Common high-frequency geographic and nationality mappings
  if (s.includes('emirates') || s.includes('uae') || s.includes('emirati') || s.includes('dubai') || s.includes('abu dhabi') || s.includes('sharjah')) return 'ae';
  if (s.includes('united kingdom') || s.includes('uk') || s.includes('british') || s.includes('england') || s.includes('britain') || s.includes('london')) return 'gb';
  if (s.includes('united states') || s.includes('usa') || s.includes('american')) return 'us';
  if (s.includes('canada') || s.includes('canadian')) return 'ca';
  if (s.includes('pakistan') || s.includes('pakistani')) return 'pk';
  if (s.includes('india') || s.includes('indian')) return 'in';
  if (s.includes('bangladesh') || s.includes('bangladeshi')) return 'bd';
  if (s.includes('saudi') || s.includes('ksa') || s.includes('riyadh')) return 'sa';
  if (s.includes('qatar') || s.includes('qatari') || s.includes('doha')) return 'qa';
  if (s.includes('kuwait') || s.includes('kuwaiti')) return 'kw';
  if (s.includes('oman') || s.includes('omani') || s.includes('muscat')) return 'om';
  if (s.includes('bahrain') || s.includes('bahraini') || s.includes('manama')) return 'bh';
  if (s.includes('egypt') || s.includes('egyptian') || s.includes('cairo')) return 'eg';
  if (s.includes('france') || s.includes('french') || s.includes('paris')) return 'fr';
  if (s.includes('germany') || s.includes('german') || s.includes('berlin')) return 'de';
  if (s.includes('russia') || s.includes('russian') || s.includes('moscow')) return 'ru';
  if (s.includes('philippines') || s.includes('filipino') || s.includes('manila')) return 'ph';
  if (s.includes('lebanon') || s.includes('lebanese') || s.includes('beirut')) return 'lb';
  if (s.includes('jordan') || s.includes('jordanian') || s.includes('amman')) return 'jo';
  if (s.includes('syria') || s.includes('syrian')) return 'sy';
  if (s.includes('iraq') || s.includes('iraqi') || s.includes('baghdad')) return 'iq';
  if (s.includes('yemen') || s.includes('yemeni')) return 'ye';
  if (s.includes('turkey') || s.includes('turkish') || s.includes('istanbul')) return 'tr';
  if (s.includes('iran') || s.includes('iranian') || s.includes('tehran')) return 'ir';
  if (s.includes('italy') || s.includes('italian') || s.includes('rome')) return 'it';
  if (s.includes('spain') || s.includes('spanish') || s.includes('madrid')) return 'es';
  if (s.includes('australia') || s.includes('australian') || s.includes('sydney')) return 'au';
  if (s.includes('south africa') || s.includes('south african')) return 'za';
  if (s.includes('nigeria') || s.includes('nigerian')) return 'ng';
  if (s.includes('kenya') || s.includes('kenyan')) return 'ke';
  if (s.includes('morocco') || s.includes('moroccan')) return 'ma';
  if (s.includes('algeria') || s.includes('algerian')) return 'dz';
  if (s.includes('tunisia') || s.includes('tunisian')) return 'tn';
  if (s.includes('sudan') || s.includes('sudanese')) return 'sd';
  if (s.includes('china') || s.includes('chinese') || s.includes('beijing')) return 'cn';
  if (s.includes('japan') || s.includes('japanese') || s.includes('tokyo')) return 'jp';
  if (s.includes('korea') || s.includes('korean') || s.includes('seoul')) return 'kr';
  if (s.includes('singapore') || s.includes('singaporean')) return 'sg';
  if (s.includes('malaysia') || s.includes('malaysian')) return 'my';
  if (s.includes('indonesia') || s.includes('indonesian') || s.includes('jakarta')) return 'id';
  if (s.includes('sri lanka') || s.includes('sri lankan') || s.includes('colombo')) return 'lk';
  if (s.includes('nepal') || s.includes('nepalese')) return 'np';
  if (s.includes('afghanistan') || s.includes('afghan')) return 'af';
  if (s.includes('palestine') || s.includes('palestinian')) return 'ps';
  if (s.includes('brazil') || s.includes('brazilian')) return 'br';
  if (s.includes('mexico') || s.includes('mexican')) return 'mx';
  if (s.includes('colombia') || s.includes('colombian')) return 'co';
  if (s.includes('switzerland') || s.includes('swiss')) return 'ch';
  if (s.includes('netherlands') || s.includes('dutch') || s.includes('holland')) return 'nl';
  if (s.includes('sweden') || s.includes('swedish')) return 'se';
  if (s.includes('norway') || s.includes('norwegian')) return 'no';
  if (s.includes('denmark') || s.includes('danish')) return 'dk';
  if (s.includes('ireland') || s.includes('irish')) return 'ie';
  if (s.includes('portugal') || s.includes('portuguese')) return 'pt';
  if (s.includes('greece') || s.includes('greek')) return 'gr';
  if (s.includes('poland') || s.includes('polish')) return 'pl';
  if (s.includes('ukraine') || s.includes('ukrainian')) return 'ua';
  if (s.includes('new zealand') || s.includes('kiwi')) return 'nz';
  if (s.includes('thailand') || s.includes('thai')) return 'th';
  if (s.includes('vietnam') || s.includes('vietnamese')) return 'vn';
  if (s.includes('belgium') || s.includes('belgian')) return 'be';
  if (s.includes('austria') || s.includes('austrian')) return 'at';
  if (s.includes('czech')) return 'cz';
  if (s.includes('romania') || s.includes('romanian')) return 'ro';
  if (s.includes('hungary') || s.includes('hungarian')) return 'hu';
  if (s.includes('kazakhstan') || s.includes('kazakh')) return 'kz';
  if (s.includes('uzbekistan')) return 'uz';
  if (s.includes('azerbaijan')) return 'az';
  if (s.includes('europe') || s.includes('european')) return 'eu';

  return null;
}

/**
 * High-definition country flag thumbnail with lazy loading and fallback
 */
export function CountryFlag({
  nationality,
  className = 'w-5 h-3.5',
}: {
  nationality: string;
  className?: string;
}) {
  const [hasError, setHasError] = React.useState(false);
  const code = getCountryCode(nationality);

  if (!code || hasError) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-[2px] bg-slate-100 border border-slate-200 text-[11px] text-slate-500 shrink-0 font-medium select-none shadow-xs`}
        title={nationality || 'Global / Unspecified'}
      >
        🌐
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={nationality}
      title={nationality}
      className={`${className} object-cover rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-black/10 shrink-0 inline-block align-middle`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export default function NationalityMatrix({ nationalities, currency }: NationalityMatrixProps) {
  const formatRevenue = (val: number) => {
    if (val >= 1000) return `${currency} ${(val / 1000).toFixed(0)}K`;
    return `${currency} ${val.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-gray-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            NATIONALITY PERFORMANCE & CONVERSION
          </h3>
          <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-xl">
            Demographics Matrix
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Geographic acquisition breakdown and conversion effectiveness.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Nationality</th>
                <th className="py-3 px-2">Leads</th>
                <th className="py-3 px-2">Won</th>
                <th className="py-3 px-2">Rate</th>
                <th className="py-3 px-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {nationalities && nationalities.length > 0 ? (
                nationalities.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 font-semibold text-gray-900 flex items-center gap-2.5">
                      <CountryFlag nationality={item.nationality} />
                      <span className="truncate">{item.nationality}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">{item.leads.toLocaleString()}</td>
                    <td className="py-3 px-2 text-emerald-600 font-semibold">{item.won.toLocaleString()}</td>
                    <td className="py-3 px-2 text-emerald-600 font-semibold">{item.conversionRate}</td>
                    <td className="py-3 px-2 text-right font-bold text-amber-600">
                      {formatRevenue(item.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 italic">
                    No nationality records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

