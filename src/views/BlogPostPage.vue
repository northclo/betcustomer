<template>
  <div class="blog-post-page">
    <div class="bg-primary-light radius-2 p-5 mt-5">
      <a-card title="News & Updates" class="game-result-card">
        <a-space direction="vertical" size="large" class="w-100">
          <!-- Featured Post -->
          <div v-if="featuredPost" class="featured-post">
            <div class="featured-image">
              <img v-if="featuredPost.image" :src="featuredPost.image" :alt="featuredPost.title" />
              <div class="featured-badge">Featured</div>
            </div>
            <div class="featured-content">
              <h2 class="featured-title">{{ featuredPost.title }}</h2>
              <p class="featured-excerpt">{{ featuredPost.excerpt }}</p>
              <div class="featured-meta">
                <span>{{ featuredPost.date }}</span>
                <span>•</span>
                <span>{{ featuredPost.category }}</span>
              </div>
              <button
                class="featured-read-more"
                @click.stop="viewPost(featuredPost)"
              >
                Read More
              </button>
            </div>
          </div>

          <!-- Blog Posts Grid -->
          <div>
            <div class="section-title">Latest Posts</div>
            <a-row :gutter="[16, 16]" class="mt-3">
              <a-col
                v-for="post in blogPosts"
                :key="post.id"
                :xs="24"
                :sm="12"
                :md="8"
              >
                <div class="blog-post-card" @click="viewPost(post)">
                  <div class="post-image">
                    <img v-if="post.image" :src="post.image" :alt="post.title" />
                    <div class="post-category">{{ post.category }}</div>
                  </div>
                  <div class="post-content">
                    <h3 class="post-title">{{ post.title }}</h3>
                    <p class="post-excerpt">{{ post.excerpt }}</p>
                    <div class="post-meta">
                      <span>{{ post.date }}</span>
                      <span>•</span>
                      <span>{{ post.readTime }} min read</span>
                    </div>
                  </div>
                </div>
              </a-col>
            </a-row>
          </div>

          <!-- Categories Filter -->
          <div>
            <div class="section-title">Categories</div>
            <div class="category-filters mt-3">
              <button
                v-for="category in categories"
                :key="category"
                class="category-btn glass-btn"
                :class="{ 'category-active': selectedCategory === category }"
                @click="filterByCategory(category)"
              >
                {{ category }}
              </button>
            </div>
          </div>
        </a-space>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';
import image1 from '@/assets/images/1.jpg';
import image2 from '@/assets/images/2.jpg';
import image3 from '@/assets/images/3.jpg';
import image4 from '@/assets/images/4.jpg';
import image5 from '@/assets/images/5.jpg';
import image6 from '@/assets/images/6.jpg';

// ✅ state
const blogPosts = ref([]);
const featuredPost = ref(null);
const selectedCategory = ref('All');
const loading = ref(false);

// ✅ constants
const categories = ['All', 'Announcements', 'Tips', 'Updates', 'Events'];

// ✅ methods
const viewPost = (post) => {
  // TODO: Navigate to post detail page or show modal
  console.log('View post:', post);
};

const filterByCategory = (category) => {
  selectedCategory.value = category;
  fetchBlogPosts();
};

const fetchBlogPosts = async () => {
  loading.value = true;
  try {
    // TODO: Replace with actual API endpoint when available
    const result = await getData(apiLink.get_blog_posts || 'customer/blog/posts', {
      category: selectedCategory.value === 'All' ? null : selectedCategory.value,
    });

    if (result.status && result.data) {
      const images = [image1, image2, image3, image4, image5, image6];
      const posts = result.data.map((item, index) => ({
        id: item._id || index,
        title: item.title || 'Sample Post Title',
        excerpt: item.excerpt || item.content?.substring(0, 100) || 'Sample post excerpt...',
        content: item.content || '',
        category: item.category || 'Updates',
        date: new Date(item.createdAt || Date.now()).toLocaleDateString(),
        readTime: item.readTime || 5,
        image: item.image || images[index % images.length] || null,
      }));

      featuredPost.value = posts[0] || null;
      blogPosts.value = posts.slice(1);
    } else {
      // Mock data for demonstration
      const mockPosts = generateMockPosts();
      featuredPost.value = mockPosts[0];
      blogPosts.value = mockPosts.slice(1);
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    // Mock data for demonstration
    const mockPosts = generateMockPosts();
    featuredPost.value = mockPosts[0];
    blogPosts.value = mockPosts.slice(1);
  } finally {
    loading.value = false;
  }
};

const generateMockPosts = () => {
  return [
    {
      id: 1,
      title: 'Welcome to Our New Betting Platform',
      excerpt: 'We are excited to announce the launch of our new betting platform with enhanced features and better user experience.',
      category: 'Announcements',
      date: new Date().toLocaleDateString(),
      readTime: 5,
      image: image1,
    },
    {
      id: 2,
      title: 'Top 10 Betting Strategies for Beginners',
      excerpt: 'Learn the essential strategies that every beginner should know before placing their first bet.',
      category: 'Tips',
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      readTime: 8,
      image: image2,
    },
    {
      id: 3,
      title: 'System Maintenance Scheduled',
      excerpt: 'We will be performing scheduled maintenance on our servers this weekend.',
      category: 'Updates',
      date: new Date(Date.now() - 172800000).toLocaleDateString(),
      readTime: 3,
      image: image3,
    },
    {
      id: 4,
      title: 'New Payment Methods Added',
      excerpt: 'We have added support for cryptocurrency and e-wallet payments.',
      category: 'Updates',
      date: new Date(Date.now() - 259200000).toLocaleDateString(),
      readTime: 4,
      image: image4,
    },
    {
      id: 5,
      title: 'Weekly Tournament Results',
      excerpt: 'Check out the winners of this week\'s betting tournament and claim your prizes.',
      category: 'Events',
      date: new Date(Date.now() - 345600000).toLocaleDateString(),
      readTime: 6,
      image: image5,
    },
    {
      id: 6,
      title: 'How to Maximize Your Winnings',
      excerpt: 'Expert tips on how to maximize your betting winnings with smart strategies.',
      category: 'Tips',
      date: new Date(Date.now() - 432000000).toLocaleDateString(),
      readTime: 7,
      image: image6,
    },
  ];
};

// ✅ lifecycle
onMounted(() => {
  fetchBlogPosts();
});
</script>

<style scoped>
.blog-post-page {
  min-height: 80vh;
}

.section-title {
  color: var(--white-color);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
}

.featured-post {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--glass-shadow);
  display: flex;
  gap: 30px;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.featured-post:hover {
  transform: translateY(-8px);
  box-shadow: var(--glass-shadow-strong);
  border-color: var(--glass-blue-border);
}

.featured-image {
  width: 400px;
  min-width: 400px;
  height: 280px;
  background: var(--gradient-blue);
  border-radius: 0;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.featured-post:hover .featured-image img {
  transform: scale(1.05);
}

.featured-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--white-color);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.featured-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 30px;
  gap: 20px;
}

.featured-title {
  color: var(--white-color);
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--white-color), rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.featured-excerpt {
  color: var(--white-color);
  font-size: 17px;
  opacity: 0.85;
  line-height: 1.7;
  margin: 0;
  font-weight: 400;
}

.featured-meta {
  color: var(--white-color);
  font-size: 14px;
  opacity: 0.75;
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
}

.featured-read-more {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid rgba(99, 102, 241, 0.5);
  color: var(--white-color);
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  width: fit-content;
}

.featured-read-more:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  border-color: rgba(99, 102, 241, 0.7);
  background: linear-gradient(135deg, rgba(99, 102, 241, 1), rgba(139, 92, 246, 1));
}

.featured-read-more::after {
  content: '→';
  font-size: 18px;
  transition: transform 0.3s ease;
}

.featured-read-more:hover::after {
  transform: translateX(4px);
}

.blog-post-card {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--glass-shadow-soft);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.blog-post-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--glass-shadow);
  border-color: var(--glass-border-light);
}

.post-image {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, var(--glass-blue), var(--glass-pink));
  position: relative;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-category {
  position: absolute;
  top: 15px;
  left: 15px;
  background: var(--glass-bg);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  color: var(--white-color);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.post-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.post-title {
  color: var(--white-color);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  line-height: 1.4;
}

.post-excerpt {
  color: var(--white-color);
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.6;
  margin-bottom: 15px;
  flex: 1;
}

.post-meta {
  color: var(--white-color);
  font-size: 12px;
  opacity: 0.7;
  display: flex;
  gap: 8px;
  align-items: center;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-btn {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid var(--glass-border);
  color: var(--white-color);
  border-radius: 10px;
  padding: 8px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.category-btn:hover {
  background: var(--glass-bg-light);
  border-color: var(--glass-blue-border);
  transform: translateY(-2px);
}

.category-active {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.3) !important;
}

@media (max-width: 768px) {
  .featured-post {
    flex-direction: column;
    gap: 0;
  }

  .featured-image {
    width: 100%;
    min-width: 100%;
    height: 220px;
  }

  .featured-content {
    padding: 30px 20px;
  }

  .featured-title {
    font-size: 24px;
  }

  .featured-excerpt {
    font-size: 15px;
  }
}
</style>

