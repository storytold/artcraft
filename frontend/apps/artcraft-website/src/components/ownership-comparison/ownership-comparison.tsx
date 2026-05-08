import { faServer, faBan, faUnlock, faKey, faGlobe, faCloud, faImage, faCreditCard, faTimes } from "@fortawesome/pro-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const OwnershipComparison = () => {
  const websiteIcons = [faCloud, faGlobe, faImage, faServer];

  return (
    <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-32 overflow-visible">
       
      <div className="text-center mb-12 sm:mb-16 relative" data-animate>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-[#ef4444]/20 blur-[40px] md:blur-[80px] pointer-events-none transform-gpu" />
        <h2 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium mb-6 !leading-tight">
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7979] to-[#ff7979]">Stop Renting </span>
           <br className="sm:hidden" />
           <span>From Websites</span>
        </h2>
        <p className="md:text-xl text-lg text-white/80 max-w-2xl mx-auto">
          We're artists, not landlords. We're going to give you ArtCraft to have and to hold <em>forever</em>. It's yours.
        </p>
        <br />
        <p className="md:text-xl text-lg text-white/80 max-w-2xl mx-auto">
          So you can dump that aggregator <s>subscription</s> rent payment.
        </p>
      </div>

      <div className="relative w-full flex flex-col md:flex-row md:aspect-[2/1] lg:aspect-[2.4/1] rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl border border-white/5 ring-4 ring-white/10">
         
         <div className="relative flex-1 flex flex-col justify-center items-center p-8 sm:p-12 overflow-hidden bg-[#1a1a1c] border-b md:border-b-0 md:border-r border-white/5 min-h-[500px] md:min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-[#ef4444]/5" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#ef4444]/5 blur-[50px] md:blur-[100px] rounded-full transform-gpu" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full my-auto">
               
               <div className="relative mb-8 h-24 w-full flex items-center justify-center">
                  {websiteIcons.map((icon, i) => {
                    const transform = `translateX(${(i - 1.5) * 50}px) translateY(${Math.abs(i-1.5) * 10}px) rotate(${(i-1.5) * 10}deg) scale(1.1)`;

                    return (
                      <div 
                        key={i} 
                        className="absolute w-14 h-14 bg-[#1e1e24] rounded-2xl flex items-center justify-center border border-white/10 text-white/40 shadow-xl z-10"
                        style={{
                           transform: transform,
                           zIndex: 10 + i,
                        }}
                      >
                         <FontAwesomeIcon icon={icon} className="text-xl" />
                         
                         <div className="absolute -top-3 -right-3 w-7 h-7 bg-[#ef4444] rounded-full flex items-center justify-center border-4 border-[#121214] text-white text-xs shadow-md">
                           <FontAwesomeIcon icon={faTimes} className="font-bold" />
                         </div>
                      </div>
                    );
                  })}
               </div>

               <h3 className="text-2xl sm:text-4xl font-medium mb-4 text-[#ff7979] md:scale-105">
                  The Rental Trap
               </h3>
               
               <p className="text-white/80 mb-8 leading-relaxed opacity-100">
                  You're paying for permission, not a product. If they shut down, you lose everything. (Ask them about downloading your LoRAs! 🤫)
               </p>

               <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm font-bold tracking-wide uppercase">
                  <div className="flex items-center gap-2 text-[#ffc9c9] bg-[#ef4444]/10 px-4 py-2.5 rounded-xl border border-[#ef4444]/20 shadow-lg shadow-red-900/10">
                     <FontAwesomeIcon icon={faBan} className="text-[#ef4444]" /> NO OWNERSHIP
                  </div>
                  <div className="flex items-center gap-2 text-[#ffc9c9] bg-[#ef4444]/10 px-4 py-2.5 rounded-xl border border-[#ef4444]/20 shadow-lg shadow-red-900/10">
                     <FontAwesomeIcon icon={faCreditCard} className="text-[#ef4444]" /> MONTHLY FEES
                  </div>
               </div>
            </div>
         </div>

         <div className="relative flex-1 flex flex-col justify-center items-center p-8 sm:p-12 overflow-hidden bg-[#18181b] min-h-[500px] md:min-h-0">
             <div className="absolute inset-0 bg-[radial-gradient(#00AABA15_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-100" />
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/10 blur-[45px] md:blur-[90px] rounded-full opacity-100 scale-110 transform-gpu" />

             <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full my-auto">
                
                <div className="mb-10 relative">
                   <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-2xl shadow-primary/30 z-10 relative scale-110 rotate-3">
                      <img src="/images/services/artcraft.svg" alt="ArtCraft" className="w-[55%] h-[55%] object-contain drop-shadow-md brightness-0 invert" />
                   </div>
                   <div className="absolute -right-6 -bottom-4 w-16 h-16 bg-[#24292e] rounded-2xl flex items-center justify-center text-white text-3xl border-4 border-[#1C1C20] z-20 shadow-xl translate-x-2 translate-y-2">
                      <FontAwesomeIcon icon={faGithub} />
                   </div>
                </div>

                <h3 className="text-2xl sm:text-4xl font-medium text-primary-300 mb-4 md:scale-105">
                   Complete Ownership
                </h3>

                <p className="text-white/80 mb-8 leading-relaxed opacity-100">
                   Download ArtCraft. You own the code, the keys, and the output. You don't even have to pay us to use it.
                   <br />
                   <div className="text-xs text-white/50 pt-3">(Lots of 3rd party logins and API keys supported. Also please pay us. We turn that into coffee and development and movies.)</div>
                </p>

                 <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm font-bold tracking-wide uppercase">
                    <div className="flex items-center gap-2 text-white bg-primary/20 px-4 py-2.5 rounded-xl border border-primary/30 shadow-lg shadow-primary/10">
                       <FontAwesomeIcon icon={faUnlock} className="text-primary" /> YOURS FOREVER
                    </div>
                    <div className="flex items-center gap-2 text-white bg-primary/20 px-4 py-2.5 rounded-xl border border-primary/30 shadow-lg shadow-primary/10">
                       <FontAwesomeIcon icon={faKey}className="text-primary" /> BYO KEYS
                    </div>
                </div>

             </div>
         </div>

         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center">
            <div className="absolute w-[400px] h-[3px] md:w-[3px] md:h-[600px] bg-gradient-to-r md:bg-gradient-to-b from-transparent via-white/30 to-transparent" />
            
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-ui-panel rounded-full flex items-center justify-center border-4 border-white/80 shadow-xl">
               <span className="text-white/80 font-bold text-sm sm:text-base tracking-tighter">VS</span>
            </div>
         </div>

      </div>

    </div>
  );
};
