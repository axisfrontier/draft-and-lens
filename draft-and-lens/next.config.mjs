/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // /how-i-read and /how-i-remember merged into /how-it-works (two tabs). Links
  // to either were shared during the beta, so both keep landing somewhere
  // rather than 404ing, and the second one lands on the half it named.
  //
  // Deliberately NOT permanent: a 308 is cached hard by browsers and would
  // outlive any decision to split the pages again. These are courtesy
  // redirects for beta-era links, not a public URL commitment.
  async redirects() {
    return [
      { source: '/how-i-read', destination: '/how-it-works', permanent: false },
      { source: '/how-i-remember', destination: '/how-it-works?tab=over-time', permanent: false },
    ];
  },
};

export default nextConfig;
