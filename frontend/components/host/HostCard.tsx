import React from 'react'

type HostCardProps ={
    headline:string;
    description?:string;    
    imgUrl:string;
}

const HostCard:React.FC<HostCardProps> = ({headline,description,imgUrl}) => {
  return (
    <div className='flex items-center  gap-4 p-6 hover:bg-gray-50 rounded-lg transition pr-10'>
        <div className='flex-1 pr-10'>
          <h3 className='text-2xl font-semibold mb-2'>{headline}</h3>
          {description && <p className='text-gray-600 text-lg'>{description}</p>}
        </div>
        <img className='h-24 w-24 object-cover rounded-lg flex-shrink-0' src={imgUrl} alt={headline}/>
        
    </div>
  )
}

export default HostCard