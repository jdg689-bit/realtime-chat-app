"use client"

import { FC, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import Button from './ui/Button'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ChatInputProps {
    chatPartner: User  
    chatId: string
}

const ChatInput: FC<ChatInputProps> = ({chatPartner, chatId}) => {

    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const [isSending, setIsSending] = useState<boolean>(false)
    const [textContent, setTextContent] = useState<string>('')

    const sendMessage = async () => {
        // don't allow empty messages
        if(!textContent) return 

        setIsSending(true);

        try {
            await axios.post('/api/message/send', { text: textContent, chatId})
            setTextContent('')
            textareaRef.current?.focus
        } catch (error) {
            toast.error('Something went wrong. Please try again later.')
        } finally {
            setIsSending(false)
        }
        
        return null
    }

  return (
    <div className='border-t border-gray-200 px-4 pt-4 mb-2 sm:mb-0'>
        <div className='relative flex-1 overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-200 focus-within:ring-2 focus-within:ring-indigo-600'>
            <TextareaAutosize 
                ref={textareaRef}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        // send message
                        event.preventDefault()
                        sendMessage();
                    }
                }}
                rows={1}
                value={textContent}
                onChange={(event) => setTextContent(event.target.value)}
                placeholder={`Message ${chatPartner.name}`}
                className='block w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6 ' 
            />

            <div 
                onClick={() => textareaRef.current?.focus()} 
                className='py-2' 
                aria-hidden='true'
            >
                <div className='py-px'>
                    <div className='h-9'></div> {/* space for send button */}
                </div>
            </div>
            <div className='absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-2'>
                <div className='flex-shrink-0'>
                    <Button onClick={sendMessage} isLoading={isSending} type='submit'>Send</Button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ChatInput