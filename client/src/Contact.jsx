/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */

import React from 'react'
import Avatar from './Avatar'

export default function Contact({id,onClick,username,selected,online})  {
  return (
    <div
        key={id}
        onClick={() => onClick(id)}
        className={`${selected ? 'bg-blue-200' : ''} border-b border-gray-100  flex items-center gap-2 cursor-pointer`}
        >
        {selected &&
            <div className="w-1 bg-blue-500 h-12 rounded-r-md" />}
        <div className="flex gap-2 py-2 pl-4 items-center">
            <Avatar online={online} username={username} userId={id} />
            <span className="text-gray-800">
            {username}
            </span>
        </div>
    </div>
  )
}
