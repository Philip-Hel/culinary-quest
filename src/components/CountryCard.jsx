import CQCard from "./CQCard";

export default function CountryCard({ country }) {
  if (!country) return null;

  return (
    <CQCard>
      <img
        src={country.flag}
        alt={country.name}
        className="
          w-32 mx-auto rounded-lg shadow 
          transition-transform duration-500 
          hover:scale-105
        "
      />
      <h2 className="text-3xl font-serif mt-4 text-center">
        {country.name}
      </h2>
      <p className="text-center text-cq-muted dark:text-cq-darkMuted text-sm mt-1">
        {country.region}
      </p>
    </CQCard>
  );
}