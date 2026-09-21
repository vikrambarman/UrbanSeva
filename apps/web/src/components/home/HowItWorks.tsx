const steps = [
  {
    icon: '🔍',
    title: 'Service Chuniye',
    description: '100+ services mein se apni zaroorat ki service choose karo',
    step: '01',
  },
  {
    icon: '📅',
    title: 'Book Kariye',
    description: 'Apna preferred date aur time slot select karo',
    step: '02',
  },
  {
    icon: '🏠',
    title: 'Expert Aayega',
    description: 'Verified professional aapke ghar aayega aur kaam karega',
    step: '03',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Kaise Kaam Karta Hai?
          </h2>
          <p className="text-muted-foreground mt-2">
            3 simple steps mein booking complete karo
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-primary/20" />

          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step Number */}
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-3xl">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              <h3 className="font-bold text-lg text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-48">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
