import { Link } from 'react-router-dom';
import styles from './YearSelector.module.scss';

interface YearSelectorProps {
  years: number[];
  selectedYear?: number | string | null;
  hrefForYear: (year: number | string) => string;
  extraItems?: { id: string; label: string; href: string }[];
}

export function YearSelector({
  years,
  selectedYear,
  hrefForYear,
  extraItems = [],
}: YearSelectorProps) {
  if (years.length === 0 && extraItems.length === 0) return null;

  return (
    <div className={styles.yearSelector}>
      {extraItems.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className={selectedYear === item.id ? styles.active : ''}
        >
          {item.label}
        </Link>
      ))}
      {years.map((year) => (
        <Link
          key={year}
          to={hrefForYear(year)}
          className={year === selectedYear ? styles.active : ''}
        >
          {year}
        </Link>
      ))}
    </div>
  );
}
