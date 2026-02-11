import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Image from 'next/image'
import cn from 'classnames'
import { useConfig } from '@/lib/config'
import useTheme from '@/lib/theme'
import FormattedDate from '@/components/FormattedDate'
import TagItem from '@/components/TagItem'
import NotionRenderer from '@/components/NotionRenderer'
import TableOfContents from '@/components/TableOfContents'

/**
 * A post renderer
 *
 * @param {PostProps} props
 *
 * @typedef {object} PostProps
 * @prop {object}   post       - Post metadata
 * @prop {object}   blockMap   - Post block data
 * @prop {string}   emailHash  - Author email hash (for Gravatar)
 * @prop {boolean} [fullWidth] - Whether in full-width mode
 */
export default function Post (props) {
  const BLOG = useConfig()
  const { post, blockMap, emailHash, fullWidth = false } = props
  const { dark } = useTheme()
  const notionRootRef = useRef(null)
  const isPage = post.type?.[0] === 'Page'

  // About page: group residents into a grid
  useEffect(() => {
    if (post.slug !== 'about') return

    const root = notionRootRef.current
    if (!root) return

    const notionPage = root.querySelector('.notion-page')
    if (!notionPage || notionPage.querySelector('.about-residents-grid')) return

    const residentsHeading = Array.from(notionPage.querySelectorAll('h3.notion-h2'))
      .find(node => node.textContent?.trim() === 'Residents & Alumni')
    if (!residentsHeading) return

    const grid = document.createElement('div')
    grid.className = 'about-residents-grid'

    let cursor = residentsHeading.nextElementSibling
    while (cursor) {
      const nameNode = cursor
      const imageNode = nameNode.nextElementSibling

      if (
        nameNode?.tagName !== 'H4' ||
        !nameNode.classList.contains('notion-h3') ||
        imageNode?.tagName !== 'FIGURE' ||
        !imageNode.classList.contains('notion-asset-wrapper-image')
      ) {
        break
      }

      const nextCursor = imageNode.nextElementSibling
      const card = document.createElement('div')
      card.className = 'about-resident-card'
      card.appendChild(nameNode)
      card.appendChild(imageNode)
      grid.appendChild(card)
      cursor = nextCursor
    }

    if (grid.children.length > 0) {
      residentsHeading.insertAdjacentElement('afterend', grid)
    }
  }, [post.slug])

  // Home page: group speakers into a grid
  useEffect(() => {
    if (post.slug !== 'home') return

    const root = notionRootRef.current
    if (!root) return

    const notionPage = root.querySelector('.notion-page')
    if (!notionPage || notionPage.querySelector('.home-speakers-grid')) return

    const speakersHeading = Array.from(notionPage.querySelectorAll('h3.notion-h2'))
      .find(node => node.textContent?.trim() === 'Guest Speakers')
    if (!speakersHeading) return

    const grid = document.createElement('div')
    grid.className = 'home-speakers-grid'

    // Find the intro text after the heading (skip it)
    let cursor = speakersHeading.nextElementSibling
    if (cursor && cursor.classList.contains('notion-text')) {
      cursor = cursor.nextElementSibling
    }

    while (cursor) {
      const nameNode = cursor
      // Speaker cards: H3 (name), then text (title), then image
      if (
        nameNode?.tagName !== 'H4' ||
        !nameNode.classList.contains('notion-h3')
      ) {
        break
      }

      const card = document.createElement('div')
      card.className = 'home-speaker-card'
      let nextCursor = nameNode.nextElementSibling

      card.appendChild(nameNode)

      // Grab the subtitle text if present
      if (nextCursor && nextCursor.classList.contains('notion-text')) {
        const afterText = nextCursor.nextElementSibling
        card.appendChild(nextCursor)
        nextCursor = afterText
      }

      // Grab the image if present
      if (nextCursor && nextCursor.tagName === 'FIGURE' && nextCursor.classList.contains('notion-asset-wrapper-image')) {
        const afterImage = nextCursor.nextElementSibling
        card.appendChild(nextCursor)
        nextCursor = afterImage
      }

      grid.appendChild(card)
      cursor = nextCursor
    }

    if (grid.children.length > 0) {
      speakersHeading.insertAdjacentElement('afterend', grid)
    }
  }, [post.slug])

  return (
    <article
      className={cn('flex flex-col', fullWidth ? 'md:px-24' : 'items-center')}
      data-post-slug={post.slug}
    >
      {post.slug !== 'home' && post.slug !== 'about' && post.slug !== 'manifesto' && (
        <h1 className={cn(
          'w-full font-bold text-3xl text-black dark:text-white font-mono tracking-tight',
          { 'max-w-2xl px-4': !fullWidth && !isPage },
          { 'max-w-6xl px-4': !fullWidth && isPage }
        )}>
          {post.title}
        </h1>
      )}
      {!isPage && (
        <nav className={cn(
          'w-full flex mt-7 items-start text-gray-500 dark:text-gray-400',
          { 'max-w-2xl px-4': !fullWidth }
        )}>
          <div className="flex mb-4">
            <a href={BLOG.socialLink || '#'} className="flex">
              <Image
                alt={BLOG.author}
                width={24}
                height={24}
                src={`https://gravatar.com/avatar/${emailHash}`}
                className="rounded-full"
              />
              <p className="ml-2 md:block">{BLOG.author}</p>
            </a>
            <span className="block">&nbsp;/&nbsp;</span>
          </div>
          <div className="mr-2 mb-4 md:ml-0">
            <FormattedDate date={post.date} />
          </div>
          {post.tags && (
            <div className="flex flex-nowrap max-w-full overflow-x-auto article-tags">
              {post.tags.map(tag => (
                <TagItem key={tag} tag={tag} />
              ))}
            </div>
          )}
        </nav>
      )}
      <div className="self-stretch -mt-4 flex flex-col items-center lg:flex-row lg:items-stretch">
        {!fullWidth && <div className="flex-1 hidden lg:block" />}
        <div
          ref={notionRootRef}
          className={cn({
            'flex-1 pr-4': fullWidth,
            'flex-none w-full max-w-6xl px-4': !fullWidth && isPage,
            'flex-none w-full max-w-2xl px-4': !fullWidth && !isPage
          })}
        >
          <NotionRenderer recordMap={blockMap} fullPage={false} darkMode={dark} />
        </div>
        {!isPage && (
          <div className={cn('order-first lg:order-[unset] w-full lg:w-auto max-w-2xl lg:max-w-[unset] lg:min-w-[160px]', fullWidth ? 'flex-none' : 'flex-1')}>
            {/* `65px` is the height of expanded nav */}
            <TableOfContents blockMap={blockMap} className="pt-3 sticky" style={{ top: '65px' }} />
          </div>
        )}
      </div>
    </article>
  )
}

Post.propTypes = {
  post: PropTypes.object.isRequired,
  blockMap: PropTypes.object.isRequired,
  emailHash: PropTypes.string.isRequired,
  fullWidth: PropTypes.bool
}
