import { Icons } from '../../assets/Images'

const Dashboard = () => {
  return (
    <div className="flex items-center justify-center  px-4 py-12">
      <section className="flex w-full max-w-2xl flex-col items-center text-center">
        <img
          src={Icons.DBoardMainLogo}
          alt="Right Route"
          className="mb-5 h-auto w-48 object-contain md:w-56"
        />

        <h1 className="text-3xl font-bold leading-tight text-[#666666] md:text-4xl">
          Administration
          <br />
          Dashboard
        </h1>

        <p className="mt-4 text-base leading-6 text-[#666666] md:text-lg">
          For comments or feature suggestions, please contact
          <br />
          <a
            href="mailto:brad@getrightroute.app"
            className="underline underline-offset-2"
          >
            brad@getrightroute.app
          </a>
        </p>
      </section>
    </div>
  )
}

export default Dashboard
