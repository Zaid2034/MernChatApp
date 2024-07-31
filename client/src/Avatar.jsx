/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
export default function Avatar({username,userId,online}){
    const color=['bg-red-200','bg-green-200','bg-purple-200','bg-blue-200','bg-yellow-200','bg-teal-200']
    const userIdBase10=parseInt(userId,16)
    const colorIndex=userIdBase10 % color.length
    const bgColor=color[colorIndex]
    return (
        <div className={`w-8 h-8 ${bgColor} relative rounded-full flex items-center`}>
            <div className="text-center w-full opacity-70">{username[0]}</div>
            <div className={`absolute w-3 h-3 bottom-0 right-0 rounded-full ${online? 'bg-green-400':'bg-gray-400'} border border-white`}></div>
        </div>
    )
}